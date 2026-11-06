import { initMotion } from './motion.js';
initMotion();
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
function closeMenu(returnFocus=false){navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');if(returnFocus)menuButton.focus();}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));});
navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true')closeMenu(true);});
matchMedia('(min-width: 801px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
const form=document.querySelector('#inquiry-form');
const service=document.querySelector('#service-field');
form.querySelector('[type=submit]').disabled=false;
const status=document.querySelector('#form-status');
const success=document.querySelector('.success-mark');
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{service.value=link.dataset.service;}));
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;success.hidden=false;success.classList.remove('celebrate');void success.offsetWidth;success.classList.add('celebrate');status.textContent='Готово! Это демонстрация: данные никуда не отправлены.';});
form.addEventListener('input',()=>{success.hidden=true;status.textContent='';});
const backTop=document.querySelector('.back-top');
function updateBackTop(){backTop.hidden=window.scrollY<500;}
window.addEventListener('scroll',updateBackTop,{passive:true});updateBackTop();
backTop.addEventListener('click',()=>{const heading=document.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const counters=document.querySelectorAll('[data-count]');
const running=new Map();
function finishCounters(){for(const [element,id] of running){cancelAnimationFrame(id);element.textContent=element.dataset.count;}running.clear();}
const counterObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const element=entry.target;counterObserver.unobserve(element);if(reduced.matches||!document.documentElement.classList.contains('motion-enabled'))continue;const total=Number(element.dataset.count),start=performance.now();function tick(now){const progress=Math.min(1,(now-start)/1100);element.textContent=String(Math.round(total*(1-Math.pow(1-progress,3))));if(progress<1)running.set(element,requestAnimationFrame(tick));else running.delete(element);}running.set(element,requestAnimationFrame(tick));}},{threshold:.6});
counters.forEach(element=>counterObserver.observe(element));
reduced.addEventListener('change',finishCounters);
new MutationObserver(()=>{if(!document.documentElement.classList.contains('motion-enabled'))finishCounters();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
