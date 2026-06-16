import React, { useState } from "react";
import { mockLeads as INIT_LEADS, mockInteractions as INIT_INTER } from "../store/mockData";
import toast from "react-hot-toast";

const COLS = [
  {key:"new",     label:"Новые",    color:"#3b82f6"},
  {key:"in_work", label:"В работе", color:"#8b5cf6"},
  {key:"booking", label:"Бронь",    color:"#f59e0b"},
  {key:"deal",    label:"Сделка",   color:"#22c55e"},
  {key:"lost",    label:"Отказ",    color:"#ef4444"},
];
const SRC = {cian:"Циан",avito:"Авито",site:"Сайт",api:"API",manual:"Ручной"};

export default function LeadsPage() {
  const [leads, setLeads] = useState(INIT_LEADS);
  const [inters, setInters] = useState(INIT_INTER);
  const [sel, setSel] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({client_name:"",client_phone:"",source:"manual"});
  const [newInterText, setNewInterText] = useState("");

  const grouped = COLS.reduce((a,c)=>({...a,[c.key]:leads.filter(l=>l.status===c.key)}),[]);

  const updateStatus = (lead, status) => {
    setLeads(p=>p.map(l=>l.id===lead.id?{...l,status}:l));
    if (sel?.id===lead.id) setSel(p=>({...p,status}));
  };

  const addInter = (leadId) => {
    if (!newInterText.trim()) return;
    const it = {id:Date.now(),lead_id:leadId,channel:"phone",direction:"outbound",text:newInterText,ts:new Date().toISOString()};
    setInters(p=>({...p,[leadId]:[...(p[leadId]||[]),it]}));
    setNewInterText("");
  };

  const createLead = () => {
    if (!form.client_name.trim()) return toast.error("Введите имя");
    const id = Date.now();
    const lead = {id,org_id:1,source:form.source,status:"new",manager_id:null,client_id:id,
      comment:null,created_at:new Date().toISOString(),
      client:{id,name:form.client_name,phone:form.client_phone||null,email:null}};
    setLeads(p=>[lead,...p]);
    toast.success("Лид создан");
    setShowCreate(false);
    setForm({client_name:"",client_phone:"",source:"manual"});
  };

  const selInters = sel ? (inters[sel.id]||[]) : [];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,color:"#e2e8f0"}}>Лиды</div>
        <button onClick={()=>setShowCreate(true)} style={{background:"#7c83f7",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Новый лид</button>
      </div>

      {/* Kanban board */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,alignItems:"start"}}>
        {COLS.map(col=>(
          <div key={col.key} style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #2a2d4a",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:col.color,textTransform:"uppercase",letterSpacing:".04em"}}>{col.label}</span>
              <span style={{fontSize:12,color:"#4b5563"}}>{grouped[col.key]?.length||0}</span>
            </div>
            {(grouped[col.key]||[]).map(lead=>(
              <div key={lead.id}
                onClick={()=>setSel(lead)}
                onMouseEnter={e=>e.currentTarget.style.borderColor=col.color+"99"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2d4a"}
                style={{margin:8,background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"border-color .15s"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:3}}>{lead.client?.name}</div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{lead.client?.phone||lead.client?.email||"—"}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{background:col.color+"22",color:col.color,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600}}>{SRC[lead.source]}</span>
                  <span style={{fontSize:10,color:"#4b5563"}}>{new Date(lead.created_at).toLocaleDateString("ru")}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Lead detail modal */}
      {sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSel(null)}>
          <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:14,padding:28,width:460,maxHeight:"85vh",overflow:"auto",position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSel(null)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <div style={{fontSize:17,fontWeight:700,color:"#e2e8f0",marginBottom:18}}>
              Лид #{sel.id} — {sel.client?.name}
            </div>
            {[["Телефон",sel.client?.phone||"—"],["Email",sel.client?.email||"—"],["Источник",SRC[sel.source]],["Комментарий",sel.comment||"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14}}>
                <span style={{color:"#6b7280"}}>{l}</span>
                <span style={{color:"#e2e8f0"}}>{v}</span>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Статус</div>
              <select value={sel.status} onChange={e=>updateStatus(sel,e.target.value)}
                style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13}}>
                {COLS.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            <div style={{borderTop:"1px solid #2a2d4a",paddingTop:14}}>
              <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:10}}>История коммуникаций</div>
              {selInters.length===0 && <div style={{fontSize:12,color:"#374151",marginBottom:8}}>Нет записей</div>}
              {selInters.map(i=>(
                <div key={i.id} style={{background:i.direction==="inbound"?"#0d1f3c":"#0f2d1e",border:`1px solid ${i.direction==="inbound"?"#3b82f633":"#22c55e33"}`,borderRadius:8,padding:"8px 12px",marginBottom:6}}>
                  <div style={{fontSize:12,color:"#e2e8f0"}}>{i.text}</div>
                  <div style={{fontSize:10,color:"#4b5563",marginTop:3}}>{i.channel} · {i.direction==="inbound"?"входящий":"исходящий"} · {new Date(i.ts).toLocaleString("ru")}</div>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <input value={newInterText} onChange={e=>setNewInterText(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addInter(sel.id)}
                  placeholder="Добавить заметку..."
                  style={{flex:1,background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"8px 12px",color:"#e2e8f0",fontSize:12,outline:"none"}}/>
                <button onClick={()=>addInter(sel.id)} style={{background:"#7c83f7",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create lead modal */}
      {showCreate && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowCreate(false)}>
          <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:14,padding:28,width:380,position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowCreate(false)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <div style={{fontSize:17,fontWeight:700,color:"#e2e8f0",marginBottom:20}}>Новый лид</div>
            {[["Имя клиента *","client_name","text","Иван Иванов"],["Телефон","client_phone","tel","+7 900 000-00-00"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:5}}>{l}</div>
                <input type={t} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none"}}/>
              </div>
            ))}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:5}}>Источник</div>
              <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}
                style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13}}>
                {Object.entries(SRC).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={createLead} style={{width:"100%",background:"#7c83f7",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Создать лид</button>
          </div>
        </div>
      )}
    </div>
  );
}
