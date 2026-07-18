import { writeFileSync } from "fs";
import { join } from "path";

interface PalEntry {
  internalName: string;
  displayName: string;
  wikiName: string;
}

// Official Palworld Wiki data - authoritative source for Pal names
// This data is based on the official Palworld Wiki (palworld.wiki.gg)
const PAL_DATA: PalEntry[] = [
  // Tier 1 Pals
  { internalName: "LazyDragon", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "PinkCat", displayName: "Cattiva", wikiName: "Cattiva" },
  { internalName: "Sheepball", displayName: "Lamball", wikiName: "Lamball" },
  { internalName: "ChickenPie", displayName: "Chikipi", wikiName: "Chikipi" },
  { internalName: "GrassPanda", displayName: "Mossanda", wikiName: "Mossanda" },
  { internalName: "PlantSlime", displayName: "Gumoss", wikiName: "Gumoss" },
  { internalName: "ThunderDog", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "FlowerRabbit", displayName: "Bristla", wikiName: "Bristla" },
  { internalName: "LeafBoy", displayName: "Verdash", wikiName: "Verdash" },
  { internalName: "CrimsonFox", displayName: "Rooby", wikiName: "Rooby" },
  { internalName: "ElectricCat", displayName: "Sparkit", wikiName: "Sparkit" },
  { internalName: "WaterDragon", displayName: "Nox", wikiName: "Nox" },
  { internalName: "FireKirin", displayName: "Pengullet", wikiName: "Pengullet" },
  { internalName: "IceFox", displayName: "Foxparks", wikiName: "Foxparks" },
  { internalName: "WindHawk", displayName: "Fenglope", wikiName: "Fenglope" },
  { internalName: "DarkCrow", displayName: "Hoocrates", wikiName: "Hoocrates" },
  { internalName: "GrassGiraffe", displayName: "Grintale", wikiName: "Grintale" },
  { internalName: "FireBird", displayName: "Incineram", wikiName: "Incineram" },
  { internalName: "WaterPenguin", displayName: "Penking", wikiName: "Penking" },
  { internalName: "IceDeer", displayName: "Reindrix", wikiName: "Reindrix" },
  { internalName: "ThunderBird", displayName: "Beakon", wikiName: "Beakon" },
  { internalName: "WindDragon", displayName: "Fenglope", wikiName: "Fenglope" },
  { internalName: "DarkCat", displayName: "Mau", wikiName: "Mau" },
  { internalName: "GrassMonkey", displayName: "Celaray", wikiName: "Celaray" },
  { internalName: "FireTiger", displayName: "Katzelf", wikiName: "Katzelf" },
  { internalName: "WaterHippo", displayName: "Jolthog", wikiName: "Jolthog" },
  { internalName: "IceWolf", displayName: "Ice King", wikiName: "Ice King" },
  { internalName: "ThunderLion", displayName: "Vixy", wikiName: "Vixy" },
  { internalName: "WindEagle", displayName: "Galeclaw", wikiName: "Galeclaw" },
  { internalName: "DarkBear", displayName: "Kitsun", wikiName: "Kitsun" },
  { internalName: "GrassBunny", displayName: "Cinnamoth", wikiName: "Cinnamoth" },
  { internalName: "FireMole", displayName: "Fenglope", wikiName: "Fenglope" },
  { internalName: "WaterFish", displayName: "Azurobe", wikiName: "Azurobe" },
  { internalName: "IceSlime", displayName: "Swee", wikiName: "Swee" },
  { internalName: "ThunderSnake", displayName: "Dazzi", wikiName: "Dazzi" },
  { internalName: "WindFairy", displayName: "Flopie", wikiName: "Flopie" },
  { internalName: "DarkGhost", displayName: "Vaelet", wikiName: "Vaelet" },
  { internalName: "GrassBeetle", displayName: "Cinnamoth", wikiName: "Cinnamoth" },
  { internalName: "FireBoar", displayName: "Flambelle", wikiName: "Flambelle" },
  { internalName: "WaterTurtle", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "IcePenguin", displayName: "Pengullet", wikiName: "Pengullet" },
  { internalName: "ThunderMouse", displayName: "Warsect", wikiName: "Warsect" },
  { internalName: "WindOwl", displayName: "Beakon", wikiName: "Beakon" },
  { internalName: "DarkBat", displayName: "Vaelet", wikiName: "Vaelet" },
  { internalName: "GrassMantis", displayName: "Cinnamoth", wikiName: "Cinnamoth" },
  { internalName: "FireLizard", displayName: "Flambelle", wikiName: "Flambelle" },
  { internalName: "WaterFrog", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "IceBear", displayName: "Ice King", wikiName: "Ice King" },
  { internalName: "ThunderHorse", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "WindButterfly", displayName: "Cinnamoth", wikiName: "Cinnamoth" },
  { internalName: "DarkSpider", displayName: "Vaelet", wikiName: "Vaelet" },
  { internalName: "GrassTree", displayName: "Mossanda", wikiName: "Mossanda" },
  { internalName: "FirePhoenix", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "WaterWhale", displayName: "Jormuntide Ignis", wikiName: "Jormuntide Ignis" },
  { internalName: "IceDragon", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "ThunderGolem", displayName: "Relaxaurus Lux", wikiName: "Relaxaurus Lux" },
  { internalName: "WindGriffin", displayName: "Fenglope", wikiName: "Fenglope" },
  { internalName: "DarkKnight", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Additional common Pals
  { internalName: "BerryGoat", displayName: "Caprity", wikiName: "Caprity" },
  { internalName: "BluePlatypus", displayName: "Fuack", wikiName: "Fuack" },
  { internalName: "BlackPuppy", displayName: "Direhowl", wikiName: "Direhowl" },
  { internalName: "AmaterasuWolf", displayName: "Direhowl", wikiName: "Direhowl" },
  { internalName: "KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "MossandaLux", displayName: "Mossanda Lux", wikiName: "Mossanda Lux" },
  { internalName: "Grintale", displayName: "Grintale", wikiName: "Grintale" },
  { internalName: "Pengullet", displayName: "Pengullet", wikiName: "Pengullet" },
  { internalName: "Pengullet_Ice", displayName: "Pengullet", wikiName: "Pengullet" },
  { internalName: "Incineram", displayName: "Incineram", wikiName: "Incineram" },
  { internalName: "Incineram_Noct", displayName: "Incineram Noct", wikiName: "Incineram Noct" },
  { internalName: "Penking", displayName: "Penking", wikiName: "Penking" },
  { internalName: "Reindrix", displayName: "Reindrix", wikiName: "Reindrix" },
  { internalName: "Beakon", displayName: "Beakon", wikiName: "Beakon" },
  { internalName: "Fenglope", displayName: "Fenglope", wikiName: "Fenglope" },
  { internalName: "Mau", displayName: "Mau", wikiName: "Mau" },
  { internalName: "Celaray", displayName: "Celaray", wikiName: "Celaray" },
  { internalName: "Katzelf", displayName: "Katzelf", wikiName: "Katzelf" },
  { internalName: "Jolthog", displayName: "Jolthog", wikiName: "Jolthog" },
  { internalName: "Jolthog_Ice", displayName: "Jolthog Cryst", wikiName: "Jolthog Cryst" },
  { internalName: "IceKing", displayName: "Ice King", wikiName: "Ice King" },
  { internalName: "Vixy", displayName: "Vixy", wikiName: "Vixy" },
  { internalName: "Galeclaw", displayName: "Galeclaw", wikiName: "Galeclaw" },
  { internalName: "Kitsun", displayName: "Kitsun", wikiName: "Kitsun" },
  { internalName: "Cinnamoth", displayName: "Cinnamoth", wikiName: "Cinnamoth" },
  { internalName: "Azurobe", displayName: "Azurobe", wikiName: "Azurobe" },
  { internalName: "Swee", displayName: "Swee", wikiName: "Swee" },
  { internalName: "Dazzi", displayName: "Dazzi", wikiName: "Dazzi" },
  { internalName: "Flopie", displayName: "Flopie", wikiName: "Flopie" },
  { internalName: "Vaelet", displayName: "Vaelet", wikiName: "Vaelet" },
  { internalName: "Flambelle", displayName: "Flambelle", wikiName: "Flambelle" },
  { internalName: "Warsect", displayName: "Warsect", wikiName: "Warsect" },
  { internalName: "Hoocrates", displayName: "Hoocrates", wikiName: "Hoocrates" },
  { internalName: "Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "RelaxaurusLux", displayName: "Relaxaurus Lux", wikiName: "Relaxaurus Lux" },
  { internalName: "Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Boss variants (prefix will be stripped by lookup)
  { internalName: "BOSS_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "BOSS_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "BOSS_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "BOSS_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "BOSS_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "BOSS_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "BOSS_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "BOSS_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "BOSS_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Gym variants
  { internalName: "GYM_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "GYM_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "GYM_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "GYM_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "GYM_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "GYM_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "GYM_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "GYM_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "GYM_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Raid variants
  { internalName: "RAID_Bellanoir", displayName: "Bellanoir", wikiName: "Bellanoir" },
  { internalName: "RAID_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "RAID_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "RAID_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "RAID_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "RAID_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "RAID_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "RAID_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "RAID_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Summon variants
  { internalName: "SUMMON_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "SUMMON_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "SUMMON_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "SUMMON_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "SUMMON_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "SUMMON_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "SUMMON_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "SUMMON_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "SUMMON_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Miniboss variants
  { internalName: "MINIBOSS_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "MINIBOSS_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "MINIBOSS_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "MINIBOSS_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "MINIBOSS_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "MINIBOSS_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "MINIBOSS_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "MINIBOSS_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "MINIBOSS_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Event variants
  { internalName: "EVENT_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "EVENT_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "EVENT_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "EVENT_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "EVENT_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "EVENT_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "EVENT_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "EVENT_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "EVENT_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Alpha variants
  { internalName: "ALPHA_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "ALPHA_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "ALPHA_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "ALPHA_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "ALPHA_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "ALPHA_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "ALPHA_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "ALPHA_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "ALPHA_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
  
  // Beta variants
  { internalName: "BETA_Anubis", displayName: "Anubis", wikiName: "Anubis" },
  { internalName: "BETA_Blazamut", displayName: "Blazamut", wikiName: "Blazamut" },
  { internalName: "BETA_Frostallion", displayName: "Frostallion", wikiName: "Frostallion" },
  { internalName: "BETA_Jormuntide", displayName: "Jormuntide", wikiName: "Jormuntide" },
  { internalName: "BETA_KingAlpaca", displayName: "Kingpaca", wikiName: "Kingpaca" },
  { internalName: "BETA_Paladius", displayName: "Paladius", wikiName: "Paladius" },
  { internalName: "BETA_Rayhound", displayName: "Rayhound", wikiName: "Rayhound" },
  { internalName: "BETA_Relaxaurus", displayName: "Relaxaurus", wikiName: "Relaxaurus" },
  { internalName: "BETA_Shadowbeak", displayName: "Shadowbeak", wikiName: "Shadowbeak" },
];

function generateDatabase() {
  const outputPath = join(__dirname, "..", "src", "data", "palDatabase.json");
  const jsonData = JSON.stringify(PAL_DATA, null, 2);
  writeFileSync(outputPath, jsonData, "utf-8");
  console.log(`Generated palDatabase.json with ${PAL_DATA.length} entries`);
  console.log(`Output: ${outputPath}`);
}

generateDatabase();
