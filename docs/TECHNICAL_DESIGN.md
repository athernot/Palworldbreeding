# Technical Design — Palworld Owned Pal Extractor

**Status:** Research & planning only (Part 3)  
**Scope:** Read-only save inspection  
**Constraint:** No parser implementation, no UI, no business logic in this stage

---

## 1. Struktur Save

### 1.1 Lokasi default (Windows / Steam)

```
%LOCALAPPDATA%\Pal\Saved\SaveGames\
└── <SteamID>/
    └── <WorldID>/                 # folder GUID 32-char hex
        ├── Level.sav              # world state utama
        ├── LevelMeta.sav          # metadata world (list UI)
        ├── LocalData.sav          # state lokal / session
        ├── WorldOption.sav        # snapshot world settings
        ├── Players/
        │   └── <PlayerUID>.sav    # satu file per player
        └── Backup/                # opsional, rolling backup
```

Pada dedicated server, path biasanya:

```
Pal/Saved/SaveGames/0/<WorldID>/
```

### 1.2 Format file `.sav`

Setiap `.sav` Palworld **bukan** GVAS mentah.

Lapisan yang diketahui komunitas:

| Layer | Isi |
| --- | --- |
| Header magic | `PlZ` (lama) atau `PlM` (Palworld ≥ 0.6) / `CNK` (Xbox Game Pass) |
| Compression | zlib (`PlZ`) atau Oodle (`PlM`) |
| Payload | Unreal **GVAS** property tree |

Setelah decompress → GVAS → dapat dikonversi ke JSON oleh tool yang sadar Palworld.

> Sumber: reverse note komunitas, README `cheahjs/palworld-save-tools`, laporan kompatibilitas 0.6 (PlM/Oodle), dokumentasi migrasi save server.

### 1.3 Peran tiap file

| File | Tanggung jawab |
| --- | --- |
| `Level.sav` | Sumber kebenaran dunia: character/pal entities, container (party/palbox), base camp, guild/group, map objects, item containers |
| `LevelMeta.sav` | Metadata ringan untuk daftar world (termasuk **World Name**) |
| `Players/<UID>.sav` | Indeks/referensi player: `PlayerUId`, `InstanceId`, container IDs (party/palbox), tech points, unlocks — **bukan** tempat utama entity Pal |
| `WorldOption.sav` | Snapshot settings world; tidak dibutuhkan untuk ekstraksi owned pal |
| `LocalData.sav` | State lokal; tidak dibutuhkan untuk ekstraksi owned pal |
| `Backup/` | Cadangan game; tidak dibaca aplikasi |

### 1.4 Hubungan antar file (critical)

```
LevelMeta.sav  ──► World Name (display)
       │
Players/<UID>.sav  ──► PlayerUId + InstanceId + Container IDs
       │                      │
       │                      ▼
       └──────────► Level.sav
                      ├─ CharacterSaveParameterMap   (player + semua pal)
                      ├─ CharacterContainerSaveData  (slot party / palbox)
                      └─ BaseCampSaveData            (base + worker pals)
```

Aturan yang dikonfirmasi tool komunitas (`Palworld-Pal-Editor`, character transfer scripts):

1. Entity player & pal **hidup di** `Level.sav` → `worldSaveData.CharacterSaveParameterMap`.
2. `Players/*.sav` menyimpan **pointer** (`OtomoCharacterContainerId`, `PalStorageContainerId`, `IndividualId`).
3. Party / Palbox = container ID di player save → slot di `CharacterContainerSaveData` → instance GUID → lookup entity di `CharacterSaveParameterMap`.
4. Matching player: `Players/<UID>.sav` `IndividualId` harus cocok dengan entry player di `Level.sav`.

---

## 2. File yang akan dibaca (read-only)

Aplikasi **hanya membaca**. Tidak menulis, tidak rename, tidak overwrite save.

### 2.1 Wajib dibaca

| Data target | File sumber | Lokasi data (konseptual) |
| --- | --- | --- |
| **World Name** | `LevelMeta.sav` | Metadata world (`WorldName`). Tool komunitas punya fitur “Rename World / LevelMeta Editor” khusus file ini. |
| **Character Name** | `Level.sav` (+ validasi via `Players/*.sav`) | Player entry di `CharacterSaveParameterMap` → `SaveParameter.NickName` (`IsPlayer = true`). `Players/*.sav` dipakai untuk bind UID/InstanceId. |
| **Party** | `Players/*.sav` + `Level.sav` | `OtomoCharacterContainerId` → slots di `CharacterContainerSaveData` → pal entities |
| **Palbox** | `Players/*.sav` + `Level.sav` | `PalStorageContainerId` → slots di `CharacterContainerSaveData` → pal entities |
| **Base** | `Level.sav` | `BaseCampSaveData` + pal yang tidak di party/palbox tetapi owned / assigned ke base |
| **Owned Pal** | `Level.sav` (+ container IDs dari player save) | Semua entry non-player di `CharacterSaveParameterMap` dengan `OwnerPlayerUId` milik player, diklasifikasi lokasi via `SlotId` / `ContainerId` |

### 2.2 Tidak dibaca (untuk scope aplikasi ini)

- `WorldOption.sav`
- `LocalData.sav`
- `Backup/*`
- Config `.ini` (`PalWorldSettings.ini`, `GameUserSettings.ini`) — kecuali nanti dibutuhkan hanya untuk discover path world, bukan untuk parse pal

### 2.3 Mapping ringkas “asal data”

| Field | File primer | File pendukung |
| --- | --- | --- |
| World Name | `LevelMeta.sav` | — |
| Character Name | `Level.sav` | `Players/<UID>.sav` (identity match) |
| Party pals | `Level.sav` | `Players/<UID>.sav` → `OtomoCharacterContainerId` |
| Palbox pals | `Level.sav` | `Players/<UID>.sav` → `PalStorageContainerId` |
| Base pals / base info | `Level.sav` | `BaseCampSaveData` (+ ownership links) |
| Owned Pal (aggregate) | `Level.sav` | semua container ID player |

---

## 3. Dependency yang digunakan

### 3.1 Keputusan

**Pendekatan yang dipilih:**

> Electron (TypeScript) tetap menjadi UI/shell.  
> Parsing binary save dilakukan oleh **adapter eksternal Python** (worker), bukan parser custom TypeScript.

**Library inti (layer decompress + GVAS → JSON):**

| Opsi | Peran | Catatan |
| --- | --- | --- |
| `palworld-save-tools` ([cheahjs/palworld-save-tools](https://github.com/cheahjs/palworld-save-tools)) | De facto community standard untuk decode struktur Palworld (`CharacterSaveParameterMap`, containers, base camp, dll.) | Dipakai banyak proyek (PalEdit, host-save-fix, server tools, Palworld-Pal-Editor). Tersedia di PyPI. |
| Dukungan Oodle / `PlM` | Wajib untuk save Palworld ≥ 0.6 | Upstream `cheahjs` terakhir signifikan ~Oct 2024; issue #214 menunjukkan break pada format Oodle. Perlu fork/maintained backend yang support `PlM` **atau** library modern setara (`palfix` + oodle extra, dll.) yang terbukti read PlM. |
| `uesave` / GVAS generic saja | Tidak cukup | Tidak mendecode blob Palworld custom (`RawData` character/container). |

### 3.2 Kenapa bukan pure TypeScript parser

1. Format GVAS + custom Palworld properties sudah matang di ekosistem Python.
2. Custom TS parser melanggar YAGNI dan menambah risiko corrupt interpretation.
3. Untuk **read-only**, memanggil converter → JSON → map ke domain model adalah jalur paling aman.

### 3.3 Integrasi ke Electron (rencana, belum diimplementasi)

```
Renderer (React)
   → IPC
Main process
   → spawn Python worker (read-only args)
   → receive JSON / structured result
   → map ke domain models (World, Player, OwnedPal)
```

Aturan keras worker:

- Hanya `open`/`read`
- Output ke memory / temp app directory milik aplikasi
- **Tidak pernah** menulis ke folder save user

### 3.4 Pinning & policy

- Pin versi library (atau commit hash fork) — upstream sendiri menyarankan pin karena breaking changes.
- Validasi magic header (`PlZ` / `PlM` / `CNK`) sebelum parse.
- Jika format tidak didukung → error eksplisit, jangan partial silent parse.

---

## 4. Flow Parser (desain pipeline)

Pipeline konseptual sesuai contract Part 2 (`ISaveReader`, `IWorldParser`, `IPlayerParser`, `IPalParser`).

```
[User picks World folder]
        │
        ▼
 ISaveReader (read-only)
   - validate folder layout
   - detect save magic (PlZ/PlM/CNK)
   - decompress + GVAS→JSON for:
       LevelMeta.sav
       Level.sav
       Players/*.sav
        │
        ├──────────────────────────────┐
        ▼                              ▼
 IWorldParser                    IPlayerParser
   LevelMeta → WorldName           Players/*.sav → UID, container IDs
                                   Level.sav player entry → NickName
        │                              │
        │                              ▼
        │                         IPalParser
        │                           - resolve Party via OtomoCharacterContainerId
        │                           - resolve Palbox via PalStorageContainerId
        │                           - resolve Base via BaseCampSaveData + ownership
        │                           - aggregate OwnedPal[]
        ▼
 ApplicationState (domain models only)
```

### 4.1 Urutan baca yang efisien

1. **`LevelMeta.sav`** dulu — ringan; dapatkan World Name / list world cepat.
2. **`Players/*.sav`** — dapatkan daftar player + container IDs.
3. **`Level.sav`** — file terbesar; decode dengan **selective custom properties** jika library mendukung (contoh flag `--custom-properties` di `palworld-save-tools`) agar tidak memproses foliage/map object yang tidak relevan.

Property minimal yang relevan untuk owned pal:

- `.worldSaveData.CharacterSaveParameterMap.Value.RawData`
- `.worldSaveData.CharacterContainerSaveData...`
- `.worldSaveData.BaseCampSaveData...`
- `.worldSaveData.GroupSaveDataMap` (opsional, jika perlu guild context)

### 4.2 Klasifikasi lokasi Owned Pal

Untuk setiap pal entity:

1. Ambil `OwnerPlayerUId`.
2. Ambil `SlotId` → `ContainerId`.
3. Bandingkan:
   - = `OtomoCharacterContainerId` → **Party**
   - = `PalStorageContainerId` → **Palbox**
   - else, jika terkait base camp workers → **Base**
   - else → **Other/Unknown** (tetap owned jika OwnerPlayerUId match)

---

## 5. Kenapa pendekatan ini

| Prinsip | Penerapan |
| --- | --- |
| **KISS** | Jangan tulis Unreal serializer sendiri; reuse tool komunitas yang sudah battle-tested. |
| **YAGNI** | Tidak butuh write-back, migrasi host, atau edit stats di tahap ini. |
| **SRP** | Reader ≠ World parser ≠ Player parser ≠ Pal parser. |
| **Clean Architecture** | Library eksternal di Infrastructure; domain models tetap murni (`World`, `Player`, `OwnedPal`). |
| **Safety** | Read-only + temp output mengurangi risiko korupsi save. |
| **Scalability** | Selective property decode mengurangi RAM/CPU vs full `Level.sav` JSON. |

Alternatif yang **ditolak** untuk V1:

| Alternatif | Alasan ditolak |
| --- | --- |
| Custom TS binary parser | Biaya tinggi, risiko tinggi, community knowledge sudah di Python |
| Hanya `uesave-rs` generic | Tidak cukup decode Palworld `RawData` |
| Embed editor GUI pihak ketiga | Out of scope; aplikasi kita read/extract focused |
| Parse `WorldOption.sav` dulu | Tidak berisi owned pal / character name |

---

## 6. Risiko kompatibilitas

| Risiko | Dampak | Severity |
| --- | --- | --- |
| Format `PlM` (Oodle) sejak Palworld ~0.6 | Upstream `palworld-save-tools` dapat gagal decompress/parse | **Tinggi** |
| Patch game menambah field / mengubah blob layout | Partial parse / missing fields / crash parser | **Tinggi** |
| `Level.sav` sangat besar | RAM tinggi, UI freeze jika parse di main thread | **Sedang–Tinggi** |
| Co-op host UID `...0001` vs dedicated Steam UID | Mapping player file vs entity bisa membingungkan user | **Sedang** |
| Xbox Game Pass `CNK` | Layout berbeda; mungkin out-of-scope awal | **Sedang** |
| Dimensional Pal Storage / fitur baru storage | Owned pal bisa berada di container ID tambahan di luar party/palbox klasik | **Sedang** |
| Library breaking changes | Build app tiba-tiba gagal setelah update dependency | **Sedang** |
| Antivirus pada Python worker / native oodle DLL | False positive / spawn gagal | **Rendah–Sedang** |

---

## 7. Cara mengatasinya

1. **Capability detection dulu**  
   Baca magic bytes. Jika `PlM` dan backend belum support Oodle → tampilkan error jelas, jangan lanjut.

2. **Gunakan backend yang support format terkini**  
   Evaluasi sebelum implementasi:
   - maintained fork `palworld-save-tools` dengan Oodle, **atau**
   - library modern setara yang dokumentasinya menyatakan support PlZ + PlM  
   Pin versi setelah lulus uji pada save user nyata.

3. **Fixture matrix**  
   Simpan sampel anonymized (dengan izin user) untuk:
   - singleplayer PlZ
   - singleplayer/dedicated PlM
   - multiplayer multi-player folder
   - world dengan base workers

4. **Selective decode + worker process**  
   Parse di child process; stream progress; batasi property yang didecode.

5. **Strict read-only I/O**  
   Buka file dengan flag read-only OS; tulis hasil hanya ke `%TEMP%` / app data; never touch save path for write.

6. **Graceful degradation**  
   Jika World Name gagal tetapi pals berhasil → tampilkan pals + warning.  
   Jika container ID hilang → owned-by-UID fallback tanpa klasifikasi Party/Palbox.

7. **Version gate di app**  
   Catat `parserBackendVersion` + `detectedSaveMagic` di `ApplicationError` / diagnostics untuk support.

8. **Xbox/CNK out of scope V1**  
   Fokus Steam/Windows dulu; CNK ditandai unsupported sampai ada bukti library stabil.

---

## 8. Implikasi ke arsitektur project (tanpa coding sekarang)

Module yang sudah disiapkan di Part 2 akan diisi kemudian sebagai berikut:

| Contract / Module | Tanggung jawab nanti |
| --- | --- |
| `ISaveReader` | Buka folder world, decompress read-only, hasilkan raw JSON/GVAS tree |
| `IWorldParser` | `LevelMeta` → `World` |
| `IPlayerParser` | Player save + Level player entry → `Player` |
| `IPalParser` | Containers + CharacterSaveParameterMap → `OwnedPal[]` |
| `SaveService` | Orkestrasi flow di atas (masih application service, bukan UI) |
| `parser/save|world|player|pal` | Implementasi adapter per concern |

---

## 9. Ringkasan keputusan

1. **World Name** → `LevelMeta.sav`  
2. **Character Name** → `Level.sav` (`NickName` pada player entity), diikat lewat `Players/*.sav`  
3. **Party / Palbox / Base / Owned Pal** → hampir seluruhnya di `Level.sav`, dengan pointer container dari `Players/*.sav`  
4. **Dependency** → komunitas Python save toolkit (berbasis `palworld-save-tools` lineage) + **wajib** support format compress terkini (`PlZ` dan `PlM`)  
5. **Integrasi** → Electron TypeScript memanggil worker read-only; domain tetap Clean Architecture  
6. **Tidak ada write path ke save user**

---

## 10. Referensi riset

- [cheahjs/palworld-save-tools](https://github.com/cheahjs/palworld-save-tools) — community standard decode/encode
- [KrisCris/Palworld-Pal-Editor](https://github.com/KrisCris/Palworld-Pal-Editor) — mapping praktis NickName, Otomo/PalStorage container IDs, ownership
- [burpheart/Palworld-Reverse-Note](https://github.com/burpheart/Palworld-Reverse-Note) — struktur folder & pemisahan Players vs Level
- Issue kompatibilitas Oodle/PlM pada `palworld-save-tools` (#214) — risiko format pasca 0.6
- Dokumentasi migrasi save (LOW.MS, WinterNode, XGamingServer) — peran `Level.sav` / `LevelMeta.sav` / `Players/`

---

**Akhir Part 3.**  
Dokumen ini adalah perencanaan teknis saja. Belum ada implementasi parser.
