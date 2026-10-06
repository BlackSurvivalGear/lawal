(function(){
'use strict';
const $=s=>document.querySelector(s), panel=$('#country-intelligence-panel'), body=$('#country-intelligence-body'), picker=$('#country-intelligence-country'), trigger=$('#country-intelligence-trigger');
if(!panel||!body||!picker||!trigger||typeof afrCountriesMetadata==='undefined') return;
const countries=afrCountriesMetadata.countries||{};
const names=Object.keys(countries).sort((a,b)=>a.localeCompare(b));
picker.innerHTML=names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
picker.value=localStorage.getItem('lawal-country')|| (countries.Nigeria?'Nigeria':names[0]);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safe(url){try{const u=new URL(url,location.href);return /^https?:$/.test(u.protocol)?u.href:'#'}catch{return '#'}}
function callCode(c){return (c.idd?.root||'')+(c.idd?.suffixes?.[0]||'')}
function currency(c){const e=Object.entries(c.currencies||{})[0];return e?{code:e[0],...e[1]}:{code:'—',name:'—',symbol:''}}
function link(item){if(!item)return '';const url=safe(item.url||'');return url==='#'?'<span class="ci-link disabled">'+esc(item.name)+'</span>':'<a class="ci-link" target="_blank" rel="noopener noreferrer" href="'+url+'">'+esc(item.name)+' ↗</a>'}
function group(title,items){return '<section class="ci-group"><h4>'+title+'</h4><div class="ci-links">'+(items||[]).map(link).join('')+'</div></section>'}
async function render(name){
 const c=countries[name]; if(!c)return; localStorage.setItem('lawal-country',name); picker.value=name;
 const d=(typeof bugoutData!=='undefined'&&bugoutData[name])||null, cur=currency(c), iso=(c.iso||'').toLowerCase();
 trigger.innerHTML='<img src="'+esc(c.flags?.png||c.flags?.svg||'')+'" alt="'+esc(name)+' flag"><span>'+esc(name)+'</span>';
 body.innerHTML='<div class="ci-loading">Loading '+esc(name)+' intelligence…</div>';
 let fx='—', weather='Weather unavailable';
 try{const r=await fetch('https://api.exchangerate-api.com/v4/latest/USD');const j=await r.json();if(j.rates?.[cur.code])fx='1 USD = '+Number(j.rates[cur.code]).toLocaleString(undefined,{maximumFractionDigits:2})+' '+cur.code}catch{}
 try{const ll=c.latlng||[];if(ll.length===2){const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+ll[0]+'&longitude='+ll[1]+'&current=temperature_2m,wind_speed_10m,relative_humidity_2m&timezone=auto');const j=await r.json();if(j.current)weather=j.current.temperature_2m+'°C · wind '+j.current.wind_speed_10m+' km/h · humidity '+j.current.relative_humidity_2m+'%'}}catch{}
 const stats=[
 ['Capital',c.capital||'—'],['Population',c.population?Number(c.population).toLocaleString():'—'],['Currency',cur.name+' ('+cur.code+')'],['Area',c.area?Number(c.area).toLocaleString()+' km²':'—'],['FX rate',fx],['Calling code',callCode(c)||'—'],['Languages',Object.values(c.languages||{}).join(', ')||'—'],['Weather',weather]
 ];
 let travel='';
 if(d){travel='<div class="ci-travel-grid">'+group('Travel documents',d.travel)+group('Air mobility',[...(d.air?.national?[{name:d.air.national+' (National)',url:d.air.nationalUrl}]:[]),...(d.air?.regional||[]),...(d.air?.search?[d.air.search]:[])])+group('Ground transport',d.ground)+group('Accommodation',d.accommodation)+group('Communications',d.comms)+group('Financial',d.financial)+'</div>';
 if(d.visaFree?.length)travel+='<section class="ci-visa"><h4>Visa-free destinations ('+d.visaFree.length+')</h4><div>'+d.visaFree.map(v=>'<span>'+esc(v.name)+(v.days?' · '+esc(v.days)+' days':'')+'</span>').join('')+'</div></section>'}
 body.innerHTML='<header class="ci-country-head"><div><img src="'+esc(c.flags?.png||c.flags?.svg||'')+'" alt=""><div><p>HOUSE OF LAWAL · WORLD DESK</p><h2>'+esc(name)+'</h2><span>'+esc(c.region||'')+' · '+esc(c.subregion||'')+'</span></div></div></header><div class="ci-stats">'+stats.map(x=>'<div><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong></div>').join('')+'</div><div class="ci-actions"><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?q='+encodeURIComponent((c.latlng||[]).join(','))+'">Map ↗</a><a target="_blank" rel="noopener noreferrer" href="https://news.google.com/search?q='+encodeURIComponent(name)+'">Live news ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.passportindex.org/passport/'+encodeURIComponent(name.toLowerCase().replace(/ /g,'-'))+'/">Passport Index ↗</a></div>'+travel;
}
function open(){panel.classList.remove('hidden');panel.setAttribute('aria-hidden','false');render(picker.value);$('#country-intelligence-close')?.focus()}
function close(){panel.classList.add('hidden');panel.setAttribute('aria-hidden','true');trigger.focus()}
trigger.addEventListener('click',open);$('#country-intelligence-close')?.addEventListener('click',close);$('.country-intelligence-backdrop')?.addEventListener('click',close);picker.addEventListener('change',()=>render(picker.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.classList.contains('hidden'))close()});
render(picker.value);
})();