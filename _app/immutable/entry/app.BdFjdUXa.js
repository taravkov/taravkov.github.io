const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["../nodes/0.CSwuYZTH.js","../chunks/disclose-version.CEbAEHaR.js","../chunks/runtime.CY1R-vTE.js","../nodes/1.PmRFY8rl.js","../chunks/legacy.ChQmyk_p.js","../chunks/render.jz0pWilW.js","../chunks/store.DXdGo-dt.js","../chunks/entry.nS1iyuuD.js","../nodes/2.BrE1Lb1O.js","../chunks/index-client.n2fbFPDs.js","../assets/2.DA8Wl8O6.css"])))=>i.map(i=>d[i]);
var I=n=>{throw TypeError(n)};var U=(n,e,r)=>e.has(n)||I("Cannot "+r);var l=(n,e,r)=>(U(n,e,"read from private field"),r?r.call(n):e.get(n)),A=(n,e,r)=>e.has(n)?I("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(n):e.set(n,r),C=(n,e,r,a)=>(U(n,e,"write to private field"),a?a.call(n,r):e.set(n,r),r);import{h as G,q as H,b as K,E as M,a as Q,c as X,a6 as Z,J as v,am as p,V as k,ap as $,O as ee,U as te,p as re,D as se,F as ne,f as w,e as ae,aq as oe,s as ce,g as ie,t as le,r as ue,ar as L,M as O}from"../chunks/runtime.CY1R-vTE.js";import{h as fe,m as de,u as me,s as he}from"../chunks/render.jz0pWilW.js";import{c as T,a as P,t as N,d as _e}from"../chunks/disclose-version.CEbAEHaR.js";import{p as q,o as ve,i as D,a as ge,b as V}from"../chunks/index-client.n2fbFPDs.js";function j(n,e,r){G&&H();var a=n,o,i;K(()=>{o!==(o=e())&&(i&&(Z(i),i=null),o&&(i=Q(()=>r(a,o))))},M),G&&(a=X)}function ye(n){return class extends be{constructor(e){super({component:n,...e})}}}var g,f;class be{constructor(e){A(this,g);A(this,f);var i;var r=new Map,a=(s,t)=>{var d=te(t);return r.set(s,d),d};const o=new Proxy({...e.props||{},$$events:{}},{get(s,t){return v(r.get(t)??a(t,Reflect.get(s,t)))},has(s,t){return t===p?!0:(v(r.get(t)??a(t,Reflect.get(s,t))),Reflect.has(s,t))},set(s,t,d){return k(r.get(t)??a(t,d),d),Reflect.set(s,t,d)}});C(this,f,(e.hydrate?fe:de)(e.component,{target:e.target,anchor:e.anchor,props:o,context:e.context,intro:e.intro??!1,recover:e.recover})),(!((i=e==null?void 0:e.props)!=null&&i.$$host)||e.sync===!1)&&$(),C(this,g,o.$$events);for(const s of Object.keys(l(this,f)))s==="$set"||s==="$destroy"||s==="$on"||ee(this,s,{get(){return l(this,f)[s]},set(t){l(this,f)[s]=t},enumerable:!0});l(this,f).$set=s=>{Object.assign(o,s)},l(this,f).$destroy=()=>{me(l(this,f))}}$set(e){l(this,f).$set(e)}$on(e,r){l(this,g)[e]=l(this,g)[e]||[];const a=(...o)=>r.call(this,...o);return l(this,g)[e].push(a),()=>{l(this,g)[e]=l(this,g)[e].filter(o=>o!==a)}}$destroy(){l(this,f).$destroy()}}g=new WeakMap,f=new WeakMap;const Ee="modulepreload",Pe=function(n,e){return new URL(n,e).href},J={},B=function(e,r,a){let o=Promise.resolve();if(r&&r.length>0){const s=document.getElementsByTagName("link"),t=document.querySelector("meta[property=csp-nonce]"),d=(t==null?void 0:t.nonce)||(t==null?void 0:t.getAttribute("nonce"));o=Promise.allSettled(r.map(u=>{if(u=Pe(u,a),u in J)return;J[u]=!0;const y=u.endsWith(".css"),x=y?'[rel="stylesheet"]':"";if(!!a)for(let m=s.length-1;m>=0;m--){const _=s[m];if(_.href===u&&(!y||_.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${x}`))return;const c=document.createElement("link");if(c.rel=y?"stylesheet":Ee,y||(c.as="script"),c.crossOrigin="",c.href=u,d&&c.setAttribute("nonce",d),document.head.appendChild(c),y)return new Promise((m,_)=>{c.addEventListener("load",m),c.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${u}`)))})}))}function i(s){const t=new Event("vite:preloadError",{cancelable:!0});if(t.payload=s,window.dispatchEvent(t),!t.defaultPrevented)throw s}return o.then(s=>{for(const t of s||[])t.status==="rejected"&&i(t.reason);return e().catch(i)})},Te={};var Re=N('<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>'),we=N("<!> <!>",1);function ke(n,e){re(e,!0);let r=q(e,"components",23,()=>[]),a=q(e,"data_0",3,null),o=q(e,"data_1",3,null);se(()=>e.stores.page.set(e.page)),ne(()=>{e.stores,e.page,e.constructors,r(),e.form,a(),o(),e.stores.page.notify()});let i=L(!1),s=L(!1),t=L(null);ve(()=>{const b=e.stores.page.subscribe(()=>{v(i)&&(k(s,!0),oe().then(()=>{k(t,ge(document.title||"untitled page"))}))});return k(i,!0),b});const d=O(()=>e.constructors[1]);var u=we(),y=w(u);D(y,()=>e.constructors[1],b=>{var c=T();const m=O(()=>e.constructors[0]);var _=w(c);j(_,()=>v(m),(E,S)=>{V(S(E,{get data(){return a()},get form(){return e.form},children:(h,xe)=>{var F=T(),W=w(F);j(W,()=>v(d),(Y,z)=>{V(z(Y,{get data(){return o()},get form(){return e.form}}),R=>r()[1]=R,()=>{var R;return(R=r())==null?void 0:R[1]})}),P(h,F)},$$slots:{default:!0}}),h=>r()[0]=h,()=>{var h;return(h=r())==null?void 0:h[0]})}),P(b,c)},b=>{var c=T();const m=O(()=>e.constructors[0]);var _=w(c);j(_,()=>v(m),(E,S)=>{V(S(E,{get data(){return a()},get form(){return e.form}}),h=>r()[0]=h,()=>{var h;return(h=r())==null?void 0:h[0]})}),P(b,c)});var x=ce(y,2);D(x,()=>v(i),b=>{var c=Re(),m=ie(c);D(m,()=>v(s),_=>{var E=_e();le(()=>he(E,v(t))),P(_,E)}),ue(c),P(b,c)}),P(n,u),ae()}const qe=ye(ke),De=[()=>B(()=>import("../nodes/0.CSwuYZTH.js"),__vite__mapDeps([0,1,2]),import.meta.url),()=>B(()=>import("../nodes/1.PmRFY8rl.js"),__vite__mapDeps([3,1,2,4,5,6,7]),import.meta.url),()=>B(()=>import("../nodes/2.BrE1Lb1O.js"),__vite__mapDeps([8,1,2,4,9,6,10]),import.meta.url)],Ve=[],je={"/":[2]},Be={handleError:({error:n})=>{console.error(n)},reroute:()=>{}};export{je as dictionary,Be as hooks,Te as matchers,De as nodes,qe as root,Ve as server_loads};