import fs from "node:fs";
import path from "node:path";
export function loadGuideLocale(setNumber:number):Record<string,string>{try{return JSON.parse(fs.readFileSync(path.join(process.cwd(),"content","sets",String(setNumber),"decision-vi.json"),"utf8")) as Record<string,string>;}catch{return {};}}
