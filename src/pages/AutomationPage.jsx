import React, { useState } from "react";
import { mockRules as INIT } from "../store/mockData";
import toast from "react-hot-toast";

const TRIGGERS = {
  new_lead_assign: { label:"Новый лид без менеджера", icon:"👤", color:"#7c83f7" },
  booking_expiring: { label:"Бронь истекает",          icon:"⏰", color:"#f59e0b" },
  lead_no_response: { label:"Нет ответа по лиду",      icon:"📞", color:"#ef4444" },
};

export default function AutomationPage() {
  const [rules, setRules] = useState(INIT);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({name:"",trigger:"new_lead_assign",params:"{}"});

  const toggle = (id) => setRules(p=>p.map(r=>r.id===id?{...r,is_active:!r.is_active}:r));
  const del = (id) => { setRules(p=>p.filter(r=>r.id!==id)); toast.success("Удалено"); };

  const create = () => {
    if (!form.name.trim()) return toast.error("Введите название");
    let params={};
    try { params=JSON.parse(form.params); } catch { return toast.error("Невалидный JSON"); }
    setRules(p=>[...p,{id:Date.now(),org_id:1,name:form.name,trigger:form.trigger,params,action:{},is_active:true}]);
    toast.success("Правило создано");
    setShowCreate(false);
    setForm({name:"",trigger:"new_lead_assign",params:"{}"});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{fontSize:20,fontWeight:700,color:"#e2e8f0"}}>Правила автоматизации</div>
        <button onClick={()=>setShowCreate(true)} style={{background:"#7c83f7",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Новое правило</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {rules.map(rule=>{
          const tr = TRIGGERS[rule.trigger]||{label:rule.trigger,icon:"⚙️",color:"#6b7280"};
          return (
            <div key={rule.id} style={{background:"#13162b",border:`1px solid ${rule.is_active?"#2a2d4a":"#1a1d2e"}`,borderRadius:12,padding:"18px 20px",opacity:rule.is_active?1:.65,transition:"opacity .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",flex:1,paddingRight:12}}>{rule.name}</div>
                {/* Toggle */}
                <div onClick={()=>toggle(rule.id)} style={{width:38,height:22,borderRadius:11,background:rule.is_active?"#22c55e":"#374151",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:rule.is_active?18:3,width:16,height:16,borderRadius:8,background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:tr.color+"18",border:`1px solid ${tr.color}33`,padding:"4px 10px",borderRadius:20,marginBottom:12}}>
                <span>{tr.icon}</span>
                <span style={{fontSize:11,color:tr.color,fontWeight:600}}>{tr.label}</span>
              </div>
              {Object.keys(rule.params).length>0 && (
                <div style={{background:"#0f1117",borderRadius:6,padding:"8px 10px",marginBottom:10,fontSize:11,color:"#6b7280",fontFamily:"monospace"}}>
                  {JSON.stringify(rule.params,null,2)}
                </div>
              )}
              <button onClick={()=>del(rule.id)} style={{background:"none",border:"1px solid #2a2d4a",color:"#6b7280",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",marginTop:4}}>Удалить</button>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowCreate(false)}>
          <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:14,padding:28,width:400,position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowCreate(false)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <div style={{fontSize:17,fontWeight:700,color:"#e2e8f0",marginBottom:20}}>Новое правило</div>
            {[["Название","name","text","Авто-распределение лидов"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:5}}>{l}</div>
                <input type={t} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none"}}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:5}}>Триггер</div>
              <select value={form.trigger} onChange={e=>setForm(p=>({...p,trigger:e.target.value}))}
                style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13}}>
                {Object.entries(TRIGGERS).map(([k,{label}])=><option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:5}}>Параметры (JSON)</div>
              <input value={form.params} onChange={e=>setForm(p=>({...p,params:e.target.value}))}
                placeholder='{"warn_before_minutes": 30}'
                style={{width:"100%",background:"#0f1117",border:"1px solid #2a2d4a",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,fontFamily:"monospace",outline:"none"}}/>
            </div>
            <button onClick={create} style={{width:"100%",background:"#7c83f7",color:"#fff",border:"none",borderRadius:8,padding:11,fontWeight:700,fontSize:14,cursor:"pointer"}}>Создать</button>
          </div>
        </div>
      )}
    </div>
  );
}
