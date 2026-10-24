const http=require('http'),fs=require('fs'),path=require('path'),url=require('url'),jwt=require('jsonwebtoken');
const SECRET='segredo-de-teste-com-mais-de-32-caracteres!!';
const ROOT=process.env.APP_ROOT||'/home/claude/entreamigosriomar/entre-amigos-cmms';
const USERS={'walter@teste.com':'00000000-0000-0000-0000-0000000000ee','gerente@teste.com':'00000000-0000-0000-0000-00000000000b','tecnico@teste.com':'00000000-0000-0000-0000-00000000000c','lider@teste.com':'00000000-0000-0000-0000-0000000000d1'};
const files={};
const tok=(email)=>{const sub=USERS[email];const now=Math.floor(Date.now()/1000);return {access_token:jwt.sign({sub,email,role:'authenticated',aud:'authenticated',exp:now+3600,iat:now},SECRET),token_type:'bearer',expires_in:3600,expires_at:now+3600,refresh_token:'r-'+email,user:{id:sub,email,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}}};
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,DELETE,OPTIONS','Access-Control-Expose-Headers':'*'};
const send=(res,code,body,h={})=>{res.writeHead(code,{...cors,'Content-Type':'application/json',...h});res.end(typeof body==='string'?body:JSON.stringify(body))};
const body=req=>new Promise(r=>{const c=[];req.on('data',d=>c.push(d));req.on('end',()=>r(Buffer.concat(c)))});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  const u=url.parse(req.url,true);
  if(req.method==='OPTIONS')return send(res,204,'');
  if(u.pathname.startsWith('/rest/v1/')){
    const b=await body(req);
    const p=http.request({host:'127.0.0.1',port:3001,path:req.url.replace('/rest/v1',''),method:req.method,headers:{...req.headers,host:'127.0.0.1:3001'}},pr=>{res.writeHead(pr.statusCode,{...pr.headers,...cors});pr.pipe(res)});
    p.on('error',e=>send(res,502,{message:e.message}));p.end(b);return;
  }
  if(u.pathname==='/auth/v1/token'){
    const b=JSON.parse((await body(req)).toString()||'{}');
    if(u.query.grant_type==='password'){ if(USERS[b.email]&&b.password==='teste123')return send(res,200,tok(b.email)); return send(res,400,{error:'invalid_grant',error_description:'Invalid login credentials',msg:'Invalid login credentials'});}
    if(u.query.grant_type==='refresh_token'){const email=(b.refresh_token||'').slice(2);if(USERS[email])return send(res,200,tok(email));return send(res,400,{error:'invalid_grant'});}
  }
  if(u.pathname==='/auth/v1/user'){try{const t=jwt.verify((req.headers.authorization||'').slice(7),SECRET);return send(res,200,{id:t.sub,email:t.email,aud:'authenticated',role:'authenticated'})}catch(e){return send(res,401,{msg:'bad jwt'})}}
  if(u.pathname==='/auth/v1/logout')return send(res,204,'');
  if(u.pathname.startsWith('/storage/v1/object/sign/os-anexos')&&req.method==='POST'){
    const b=JSON.parse((await body(req)).toString());
    return send(res,200,(b.paths||[]).map(p=>({path:p,signedURL:'/object/sign/os-anexos/'+p+'?token=t',error:files[p]?null:'not found'})));
  }
  if(u.pathname.startsWith('/storage/v1/object/sign/os-anexos/')){const p=decodeURIComponent(u.pathname.replace('/storage/v1/object/sign/os-anexos/',''));if(!files[p])return send(res,404,{});res.writeHead(200,{...cors,'Content-Type':files[p].type});return res.end(files[p].data);}
  if(u.pathname.startsWith('/storage/v1/object/os-anexos/')&&req.method==='POST'){
    try{jwt.verify((req.headers.authorization||'').slice(7),SECRET)}catch(e){return send(res,401,{message:'unauthorized'})}
    const p=decodeURIComponent(u.pathname.replace('/storage/v1/object/os-anexos/',''));let data=await body(req),type=req.headers['content-type']||'image/jpeg';
    const mb=/multipart\/form-data; boundary=(.+)$/.exec(type);
    if(mb){const raw=data.toString('latin1');const parts=raw.split('--'+mb[1]);const part=parts.find(x=>/filename=/.test(x))||parts[1];const hEnd=part.indexOf('\r\n\r\n');const ct=/Content-Type: ([^\r\n]+)/i.exec(part.slice(0,hEnd));data=Buffer.from(part.slice(hEnd+4,part.length-2),'latin1');type=ct?ct[1]:'image/jpeg';}
    console.log('UPLOAD',p,type,data.length);files[p]={data,type};return send(res,200,{Key:'os-anexos/'+p,Id:p});
  }
  if(u.pathname.startsWith('/realtime'))return send(res,404,{});
  let fp=path.join(ROOT,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory())return send(res,404,{error:'not found '+u.pathname});
  res.writeHead(200,{...cors,'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(fp).pipe(res);
}).listen(8080,()=>console.log('gateway 8080'));
