import React, { useState, useEffect, useCallback, useRef } from "react";
import { mockProjects, mockUnits, mockBookings } from "../store/mockData";
import toast from "react-hot-toast";

const STATUS_COLOR = {
  free:         { bg:"#0f2d1e", border:"#22c55e", text:"#22c55e", label:"Свободна"  },
  booked:       { bg:"#2a1f08", border:"#f59e0b", text:"#f59e0b", label:"Бронь"     },
  reserved_ddu: { bg:"#0d1f3c", border:"#60a5fa", text:"#60a5fa", label:"ДДУ"       },
  sold:         { bg:"#2a0d0d", border:"#ef4444", text:"#ef4444", label:"Продана"   },
};

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setLeft(`${Math.floor(d/60)}:${String(d%60).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span style={{fontSize:10,color:"#f59e0b"}}>⏱{left}</span>;
}

export default function ChessPage() {
  const [units, setUnits]       = useState(() => JSON.parse(JSON.stringify(mockUnits)));
  const [bookings, setBookings] = useState(() => JSON.parse(JSON.stringify(mockBookings)));
  const [selected, setSelected] = useState(null);
  const [activeProj, setActiveProj] = useState(1);
  const [wsLog, setWsLog]       = useState([]);
  const timerRef = useRef(null);

  // Simulate WS: auto-expire the demo booking after its timer
  useEffect(() => {
    const check = setInterval(() => {
      setBookings(prev => {
        const now = Date.now();
        let changed = false;
        const next = prev.map(b => {
          if (b.status === "active" && new Date(b.expires_at) <= now) {
            changed = true;
            setUnits(u => {
              const n = {...u};
              for (const bid in n) n[bid] = n[bid].map(x => x.id === b.unit_id ? {...x, status:"free"} : x);
              return n;
            });
            setWsLog(l => [{time: new Date().toLocaleTimeString("ru"), text:`⏰ Бронь #${b.id} истекла — квартира ${b.unit_id} свободна`}, ...l].slice(0,8));
            toast("Бронь снята автоматически!", {icon:"⏰"});
            return {...b, status:"expired"};
          }
          return b;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(check);
  }, []);

  // Simulate incoming lead from public showcase
  useEffect(() => {
    const t = setTimeout(() => {
      setWsLog(l => [{time: new Date().toLocaleTimeString("ru"), text:"🔔 Новый лид с сайта: Виктор Громов +79001234567"}, ...l].slice(0,8));
      toast.success("Новый лид с сайта!", {duration:4000});
    }, 12_000);
    return () => clearTimeout(t);
  }, []);

  const booking = (uid) => bookings.find(b => b.unit_id === uid && b.status === "active");

  const doBook = (unit) => {
    if (unit.status !== "free") return;
    const exp = new Date(Date.now() + 90_000).toISOString();
    const nb = {id: Date.now(), unit_id: unit.id, client_id: 99, expires_at: exp, status:"active"};
    setBookings(p => [...p, nb]);
    setUnits(p => {
      const n={...p};
      for (const bid in n) n[bid]=n[bid].map(x=>x.id===unit.id?{...x,status:"booked"}:x);
      return n;
    });
    setWsLog(l => [{time:new Date().toLocaleTimeString("ru"),text:`📌 Квартира №${unit.number} забронирована (90 сек)`},...l].slice(0,8));
    toast.success("Бронь создана на 90 секунд!");
    setSelected({...unit, status:"booked"});
  };

  const doCancel = (unit) => {
    const b = booking(unit.id);
    if (!b) return;
    setBookings(p => p.map(x => x.id===b.id ? {...x,status:"expired"} : x));
    setUnits(p => {
      const n={...p};
      for (const bid in n) n[bid]=n[bid].map(x=>x.id===unit.id?{...x,status:"free"}:x);
      return n;
    });
    setWsLog(l => [{time:new Date().toLocaleTimeString("ru"),text:`❌ Бронь с кв. №${unit.number} снята вручную`},...l].slice(0,8));
    toast("Бронь снята");
    setSelected({...unit, status:"free"});
  };

  const doDDU = (unit) => {
    const b = booking(unit.id);
    if (b) setBookings(p => p.map(x => x.id===b.id ? {...x,status:"converted"} : x));
    setUnits(p => {
      const n={...p};
      for (const bid in n) n[bid]=n[bid].map(x=>x.id===unit.id?{...x,status:"reserved_ddu"}:x);
      return n;
    });
    setWsLog(l => [{time:new Date().toLocaleTimeString("ru"),text:`📄 Кв. №${unit.number} → ДДУ`},...l].slice(0,8));
    toast.success("ДДУ оформлен!");
    setSelected({...unit, status:"reserved_ddu"});
  };

  const doSell = (unit) => {
    setUnits(p => {
      const n={...p};
      for (const bid in n) n[bid]=n[bid].map(x=>x.id===unit.id?{...x,status:"sold"}:x);
      return n;
    });
    setWsLog(l => [{time:new Date().toLocaleTimeString("ru"),text:`💰 Кв. №${unit.number} ПРОДАНА`},...l].slice(0,8));
    toast.success("Квартира продана!");
    setSelected({...unit, status:"sold"});
  };

  const proj = mockProjects.find(p=>p.id===activeProj);

  const renderBuilding = (b) => {
    const bUnits = units[b.id] || [];
    const byFloor = {};
    for (const u of bUnits) { if (!byFloor[u.floor]) byFloor[u.floor]=[]; byFloor[u.floor].push(u); }
    const floors = Object.keys(byFloor).map(Number).sort((a,c)=>c-a);
    return (
      <div key={b.id} style={{marginBottom:28}}>
        <div style={{fontSize:13,fontWeight:600,color:"#6b7280",marginBottom:10}}>{b.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"36px repeat(4,1fr)",gap:5}}>
          {floors.map(floor=>[
            <div key={`f${floor}`} style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#4b5563",fontWeight:700}}>{floor}</div>,
            ...(byFloor[floor]||[]).map(unit=>{
              const c = STATUS_COLOR[unit.status]||STATUS_COLOR.free;
              const bk = booking(unit.id);
              return (
                <div key={unit.id}
                  onClick={()=>setSelected(unit)}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.06)";e.currentTarget.style.boxShadow=`0 0 14px ${c.border}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}
                  style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:8,padding:"9px 6px",textAlign:"center",cursor:"pointer",transition:"transform .12s,box-shadow .12s",position:"relative"}}>
                  <div style={{fontSize:10,color:"#6b7280",marginBottom:2}}>№{unit.number}</div>
                  <div style={{fontSize:14,fontWeight:800,color:c.text}}>{unit.rooms}к</div>
                  <div style={{fontSize:10,color:"#4b5563",marginTop:1}}>{unit.area}м²</div>
                  {bk && <div style={{marginTop:3}}><Countdown expiresAt={bk.expires_at}/></div>}
                </div>
              );
            })
          ])}
        </div>
      </div>
    );
  };

  const selCurrent = selected ? (units[1]||[]).concat(units[2]||[]).find(u=>u.id===selected.id) || selected : null;
  const selBooking = selCurrent ? booking(selCurrent.id) : null;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,color:"#e2e8f0"}}>Шахматка квартир</div>
        <div style={{display:"flex",gap:12}}>
          {Object.entries(STATUS_COLOR).map(([st,{border,label}])=>(
            <div key={st} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6b7280"}}>
              <div style={{width:10,height:10,borderRadius:2,border:`2px solid ${border}`,background:STATUS_COLOR[st].bg}}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {mockProjects.map(p=>(
          <button key={p.id} onClick={()=>setActiveProj(p.id)}
            style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${activeProj===p.id?"#7c83f7":"#2a2d4a"}`,background:activeProj===p.id?"#7c83f7":"transparent",color:activeProj===p.id?"#fff":"#8892b0",cursor:"pointer",fontSize:13,fontWeight:activeProj===p.id?600:400}}>
            {p.title}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,marginBottom:24}}>
        {proj?.buildings.map(b=>renderBuilding(b))}
      </div>

      {/* Live events */}
      {wsLog.length>0 && (
        <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:10,padding:14,marginTop:8}}>
          <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:8}}>⚡ Live события (WebSocket)</div>
          {wsLog.map((e,i)=>(
            <div key={i} style={{fontSize:12,color:"#8892b0",display:"flex",gap:10,padding:"4px 0",borderBottom:i<wsLog.length-1?"1px solid #1a1d2e":"none"}}>
              <span style={{color:"#4b5563",minWidth:60}}>{e.time}</span>
              <span>{e.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Unit modal */}
      {selCurrent && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSelected(null)}>
          <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:14,padding:28,width:380,position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <div style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:18}}>Квартира №{selCurrent.number}</div>
            {[
              ["Статус", <span style={{background:STATUS_COLOR[selCurrent.status]?.bg,color:STATUS_COLOR[selCurrent.status]?.text,border:`1px solid ${STATUS_COLOR[selCurrent.status]?.border}`,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{STATUS_COLOR[selCurrent.status]?.label}</span>],
              ["Этаж",   selCurrent.floor],
              ["Комнат", selCurrent.rooms],
              ["Площадь",`${selCurrent.area} м²`],
              ["Цена",   `${Number(selCurrent.price).toLocaleString("ru")} ₽`],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14}}>
                <span style={{color:"#6b7280"}}>{l}</span>
                <span style={{color:"#e2e8f0",fontWeight:500}}>{v}</span>
              </div>
            ))}
            {selBooking && (
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14}}>
                <span style={{color:"#6b7280"}}>Истекает</span>
                <span style={{color:"#f59e0b"}}><Countdown expiresAt={selBooking.expires_at}/></span>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap"}}>
              {selCurrent.status==="free" && <button onClick={()=>doBook(selCurrent)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#f59e0b",color:"#fff",fontWeight:700,cursor:"pointer"}}>Забронировать</button>}
              {selCurrent.status==="booked" && <>
                <button onClick={()=>doCancel(selCurrent)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",fontWeight:700,cursor:"pointer"}}>Снять бронь</button>
                <button onClick={()=>doDDU(selCurrent)}   style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#60a5fa",color:"#fff",fontWeight:700,cursor:"pointer"}}>Оформить ДДУ</button>
              </>}
              {selCurrent.status==="reserved_ddu" && <button onClick={()=>doSell(selCurrent)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#22c55e",color:"#fff",fontWeight:700,cursor:"pointer"}}>Отметить продана</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
