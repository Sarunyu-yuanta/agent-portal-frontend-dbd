const t = await (await fetch("http://localhost:9222/json/new?about:blank",{method:"PUT"})).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id=0; const pending=new Map();
ws.onmessage=(e)=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result??m.error);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
const send=(method,params={})=>new Promise(res=>{const myId=++id;pending.set(myId,res);ws.send(JSON.stringify({id:myId,method,params}));});
const ev=async(e)=>{const {result}=await send("Runtime.evaluate",{expression:e,returnByValue:true});return result.value;};
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1200,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://localhost:3000/command-center"});
await new Promise(r=>setTimeout(r,4500));
console.log(await ev(`JSON.stringify([...document.querySelectorAll('[role=button]')].map(r=>{
  const b=r.querySelector('button');
  const pill=[...r.querySelectorAll('span')].find(s=>/ครบกำหนด|เลยกำหนด/.test(s.textContent));
  return {btn:b?Math.round(b.getBoundingClientRect().height):null, pill:pill?Math.round(pill.getBoundingClientRect().height):null};
}),null,1)`));
await fetch(`http://localhost:9222/json/close/${t.id}`); ws.close();
