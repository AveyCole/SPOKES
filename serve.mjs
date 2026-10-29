// Local preview only. Bind to loopback; never serves outside docs/.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);
 if(file!==path.resolve(root)&&!file.startsWith(root)){res.writeHead(403);res.end();return;}
 const st=await stat(file),target=st.isDirectory()?path.join(file,'index.html'):file;
 res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(await readFile(target));
 }catch{res.writeHead(404);res.end('Not found');}});
server.listen(8769,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8769/'));
