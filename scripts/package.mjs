import {readdir,readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root} from './serve.mjs';
// Store-only ZIP, UTF-8 names, fixed timestamp. No executable dependencies.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function zipFiles(files){const local=[],central=[];let offset=0;
 for(const {name,data} of files){const filename=Buffer.from(name),bytes=Buffer.from(data);if(name.startsWith('/')||name.split('/').includes('..'))throw new Error('Unsafe archive path');const crc=crc32(bytes);const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(0x21,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(bytes.length,18);h.writeUInt32LE(bytes.length,22);h.writeUInt16LE(filename.length,26);local.push(h,filename,bytes);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(0x21,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(bytes.length,24);c.writeUInt16LE(filename.length,28);c.writeUInt32LE(offset,42);central.push(c,filename);offset+=h.length+filename.length+bytes.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,directory,end]);
}
export async function packageSource(){const files=[];const metadata=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 async function visit(relative){const absolute=path.join(root,relative),info=await lstat(absolute);if(info.isSymbolicLink())throw new Error(`Refusing symlink: ${relative}`);if(info.isDirectory()){for(const name of (await readdir(absolute)).sort())if(!name.startsWith('.'))await visit(path.posix.join(relative,name));}else files.push({name:`functional-minimalism/${relative}`,data:await readFile(absolute)});}
 for(const relative of [...metadata.files,'package.json','test'])await visit(relative);
 const zip=zipFiles(files);await mkdir(path.join(root,'dist'),{recursive:true});await writeFile(path.join(root,'dist/functional-minimalism-source.zip'),zip);return zip;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await packageSource();console.log('Packaged dist/functional-minimalism-source.zip');}
