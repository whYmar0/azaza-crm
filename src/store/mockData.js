export const mockUser = { id: 1, full_name: "Алексей Петров", email: "admin@crm.dev", role: "admin", org_id: 1 };

export const mockProjects = [
  {
    id: 1, title: "ЖК Солнечный", address: "г. Москва, ул. Садовая, 15",
    buildings: [
      { id: 1, name: "Корпус 1", floors: 5 },
      { id: 2, name: "Корпус 2", floors: 5 },
    ],
  },
];

const makeUnit = (id, bId, floor, apt, rooms, status) => ({
  id, building_id: bId, floor, number: `${bId}-${floor}0${apt}`,
  area: +(28 + rooms * 12 + floor * 2 + apt * 3).toFixed(1),
  rooms, price: +(28 + rooms * 12 + floor * 2 + apt * 3) * 200000,
  status,
});

let uid = 1;
const st1 = ["free","free","booked","sold","free","free","free","reserved_ddu","free","booked","free","free","sold","sold","free","free","free","free","free","free"];
const st2 = ["free","free","free","free","free","sold","free","booked","free","free","reserved_ddu","free","free","free","free","sold","free","free","free","free"];

export const mockUnits = {};
const rooms = [1,2,3,2];
for (let f=1;f<=5;f++) for (let a=1;a<=4;a++) {
  const idx=(f-1)*4+(a-1), r=rooms[a-1];
  if (!mockUnits[1]) mockUnits[1]=[];
  if (!mockUnits[2]) mockUnits[2]=[];
  mockUnits[1].push(makeUnit(uid++,1,f,a,r,st1[idx]));
  mockUnits[2].push(makeUnit(uid++,2,f,a,r,st2[idx]));
}

export const mockBookings = [
  { id: 1, unit_id: 3, client_id: 3, expires_at: new Date(Date.now()+90_000).toISOString(), status:"active" },
  { id: 2, unit_id: 32, client_id: 1, expires_at: new Date(Date.now()+300_000).toISOString(), status:"active" },
];

export const mockLeads = [
  { id:1, org_id:1, source:"cian",   status:"new",     manager_id:null, client_id:1, comment:"Интересуется 2к", created_at:"2024-06-10T09:00:00Z", client:{id:1,name:"Ольга Смирнова",   phone:"+79161234567",email:"olga@email.com"} },
  { id:2, org_id:1, source:"avito",  status:"in_work", manager_id:3,    client_id:2, comment:"Подбираем этаж", created_at:"2024-06-11T11:30:00Z", client:{id:2,name:"Дмитрий Карпов",   phone:"+79035559988",email:null} },
  { id:3, org_id:1, source:"site",   status:"booking", manager_id:3,    client_id:3, comment:"Бронируем 3к",  created_at:"2024-06-12T14:00:00Z", client:{id:3,name:"Светлана Волкова", phone:"+79264447733",email:null} },
  { id:4, org_id:1, source:"manual", status:"deal",    manager_id:2,    client_id:4, comment:"ДДУ подписан",  created_at:"2024-06-08T08:00:00Z", client:{id:4,name:"Андрей Михайлов",  phone:null,          email:"andrey@corp.ru"} },
  { id:5, org_id:1, source:"api",    status:"lost",    manager_id:3,    client_id:5, comment:"Выбрал другой ЖК",created_at:"2024-06-05T16:00:00Z",client:{id:5,name:"Наталья Белова",   phone:"+79099876543",email:null} },
  { id:6, org_id:1, source:"cian",   status:"new",     manager_id:null, client_id:6, comment:null,           created_at:"2024-06-15T10:00:00Z", client:{id:6,name:"Иван Козлов",      phone:"+79001112233",email:null} },
  { id:7, org_id:1, source:"avito",  status:"in_work", manager_id:3,    client_id:7, comment:"Нужна парковка",created_at:"2024-06-14T12:00:00Z", client:{id:7,name:"Мария Орлова",     phone:"+79887776655",email:"m@mail.ru"} },
];

export const mockInteractions = {
  2: [
    { id:1, lead_id:2, channel:"phone",  direction:"inbound",  text:"Клиент позвонил, интересуется 2к на 3 этаже", ts:"2024-06-11T11:30:00Z" },
    { id:2, lead_id:2, channel:"email",  direction:"outbound", text:"Отправили коммерческое предложение с планировками", ts:"2024-06-11T14:00:00Z" },
    { id:3, lead_id:2, channel:"phone",  direction:"outbound", text:"Перезвонили, договорились о показе", ts:"2024-06-12T10:00:00Z" },
  ],
  3: [
    { id:4, lead_id:3, channel:"phone",  direction:"inbound",  text:"Хочет забронировать 3к на 4 этаже", ts:"2024-06-12T14:00:00Z" },
    { id:5, lead_id:3, channel:"system", direction:"outbound", text:"[АВТО] Лид назначен менеджеру Иван Сидоров", ts:"2024-06-12T14:01:00Z" },
  ],
};

export const mockDashboard = {
  unit_stats: { total: 40, free: 26, booked: 4, reserved_ddu: 4, sold: 6 },
  revenue: 42_600_000,
  leads_total: 7, leads_new: 2, leads_in_work: 2, leads_deal: 1, leads_lost: 1,
  conversion_rate: 14.3,
};

export const mockRules = [
  { id:1, org_id:1, name:"Авто-распределение новых лидов",  trigger:"new_lead_assign",  params:{},                            action:{type:"assign_round_robin"}, is_active:true  },
  { id:2, org_id:1, name:"Напоминание об истекающей брони", trigger:"booking_expiring",  params:{warn_before_minutes:30},      action:{type:"notify_manager"},     is_active:true  },
  { id:3, org_id:1, name:"Нет ответа 24 часа",             trigger:"lead_no_response",  params:{no_response_hours:24},        action:{type:"send_reminder"},      is_active:false },
];
