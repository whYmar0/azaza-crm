import React, { useState, useEffect } from "react";
import { mockDashboard, mockUnits } from "../store/mockData";

const FUNNEL = [
  {key:"leads_new",    label:"Новые",    color:"#3b82f6"},
  {key:"leads_in_work",label:"В работе", color:"#8b5cf6"},
  {key:"leads_deal",   label:"Сделка",   color:"#22c55e"},
  {key:"leads_lost",   label:"Отказ",    color:"#ef4444"},
];

function MetricCard({label,value,color,sub}) {
  return (
    <div style={{background:"#13162b",border:`1px solid ${color}33`,borderRadius:12,padding:"20px 22px"}}>
      <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>{label}</div>
      <div style={{fontSize:30,fontWeight:800,color}}>{value}</div>
      {sub && <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const d = mockDashboard;
  const maxL = Math.max(d.leads_new, d.leads_in_work, d.leads_deal, d.leads_lost, 1);

  // Animated counters
  const [counts, setCounts] = useState({free:0,booked:0,reserved_ddu:0,sold:0,revenue:0,conversion:0});
  useEffect(()=>{
    const t = setTimeout(()=>setCounts({
      free:d.unit_stats.free, booked:d.unit_stats.booked,
      reserved_ddu:d.unit_stats.reserved_ddu, sold:d.unit_stats.sold,
      revenue:d.revenue, conversion:d.conversion_rate,
    }),100);
    return ()=>clearTimeout(t);
  },[]);

  const total = d.unit_stats.total;
  const segments = [
    {key:"free",val:d.unit_stats.free,color:"#22c55e",label:"Свободно"},
    {key:"booked",val:d.unit_stats.booked,color:"#f59e0b",label:"Бронь"},
    {key:"reserved_ddu",val:d.unit_stats.reserved_ddu,color:"#60a5fa",label:"ДДУ"},
    {key:"sold",val:d.unit_stats.sold,color:"#ef4444",label:"Продано"},
  ];

  return (
    <div>
      <div style={{fontSize:20,fontWeight:700,color:"#e2e8f0",marginBottom:24}}>Дашборд</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        <MetricCard label="Свободных квартир" value={d.unit_stats.free} color="#22c55e" sub={`из ${total} всего`}/>
        <MetricCard label="В брони" value={d.unit_stats.booked} color="#f59e0b"/>
        <MetricCard label="Продано" value={d.unit_stats.sold} color="#ef4444"/>
        <MetricCard label="Оформлен ДДУ" value={d.unit_stats.reserved_ddu} color="#60a5fa"/>
        <MetricCard label="Выручка" value={`${(d.revenue/1e6).toFixed(1)} млн ₽`} color="#a855f7"/>
        <MetricCard label="Конверсия лидов" value={`${d.conversion_rate}%`} color="#7c83f7" sub={`${d.leads_deal} сделки из ${d.leads_total} лидов`}/>
      </div>

      {/* Stacked bar */}
      <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:12,padding:20,marginBottom:24}}>
        <div style={{fontSize:13,fontWeight:600,color:"#8892b0",marginBottom:14}}>Структура фонда квартир</div>
        <div style={{display:"flex",height:28,borderRadius:6,overflow:"hidden",marginBottom:12}}>
          {segments.map(s=>(
            <div key={s.key} style={{width:`${s.val/total*100}%`,background:s.color,transition:"width .8s ease"}}/>
          ))}
        </div>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          {segments.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#8892b0"}}>
              <div style={{width:10,height:10,borderRadius:2,background:s.color}}/>
              {s.label}: <strong style={{color:"#e2e8f0"}}>{s.val}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div style={{background:"#13162b",border:"1px solid #2a2d4a",borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:"#8892b0",marginBottom:18}}>Воронка лидов</div>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",height:160}}>
          {FUNNEL.map(({key,label,color})=>{
            const val = d[key];
            const h = Math.max(16, (val/maxL)*140);
            return (
              <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
                <div style={{fontSize:20,fontWeight:800,color,marginBottom:4}}>{val}</div>
                <div style={{width:"100%",height:h,background:color+"33",border:`1px solid ${color}55`,borderRadius:"6px 6px 0 0",transition:"height .8s ease"}}/>
                <div style={{fontSize:11,color:"#6b7280",marginTop:6,textAlign:"center"}}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
