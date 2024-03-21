import fs from "node:fs/promises";

// list directory contents

const directories = ["schemas"];

for (const directory of directories) {
  const files = await fs.readdir(directory, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      directories.push(`${directory}/${file.name}`);
    } else if (file.isFile()) {
      console.log(`${directory}/${file.name}`);
      if (file.name.endsWith(".ts")) {
        console.log('importing file...');
        
        const content = await import (`../${directory}/${file.name}`);
        console.log(JSON.stringify(content.default));
        await fs.mkdir(`./build/${directory}`, { recursive: true });
        await fs.writeFile(`./build/${directory}/${file.name.slice(0,-3)}.json`, JSON.stringify(content.default),{encoding: 'utf-8'});
      }
    }
  }
}
