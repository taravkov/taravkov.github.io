import{Y as A,Z as z,_ as J,$ as m,a0 as Q,V as g,a1 as o,a2 as N,J as P,B as F,a3 as W,a4 as X,R as p,b as ee,a5 as Y,a as U,a6 as j,h as q,q as ae,E as re,a7 as te,a8 as ne,o as ie,m as G,c as fe,a9 as se,aa as ue,G as D,ab as le,ac as _e,ad as ve,ae as de,af as ce,ag as oe,ah as ye,Q as Z,ai as he,aj as k,ak as be,al as ge,am as Pe,M as $,an as me,ao as Ee,U as Re,C,F as we}from"./runtime.O_RO2KHb.js";import{c as Ie}from"./store.iC52Bw9C.js";function I(a,t=null,v){if(typeof a!="object"||a===null||A in a)return a;const h=X(a);if(h!==z&&h!==J)return a;var f=new Map,u=p(a),d=m(0);u&&f.set("length",m(a.length));var c;return new Proxy(a,{defineProperty(s,e,r){(!("value"in r)||r.configurable===!1||r.enumerable===!1||r.writable===!1)&&Q();var n=f.get(e);return n===void 0?(n=m(r.value),f.set(e,n)):g(n,I(r.value,c)),!0},deleteProperty(s,e){var r=f.get(e);if(r===void 0)e in s&&f.set(e,m(o));else{if(u&&typeof e=="string"){var n=f.get("length"),i=Number(e);Number.isInteger(i)&&i<n.v&&g(n,i)}g(r,o),H(d)}return!0},get(s,e,r){var y;if(e===A)return a;var n=f.get(e),i=e in s;if(n===void 0&&(!i||(y=N(s,e))!=null&&y.writable)&&(n=m(I(i?s[e]:o,c)),f.set(e,n)),n!==void 0){var l=P(n);return l===o?void 0:l}return Reflect.get(s,e,r)},getOwnPropertyDescriptor(s,e){var r=Reflect.getOwnPropertyDescriptor(s,e);if(r&&"value"in r){var n=f.get(e);n&&(r.value=P(n))}else if(r===void 0){var i=f.get(e),l=i==null?void 0:i.v;if(i!==void 0&&l!==o)return{enumerable:!0,configurable:!0,value:l,writable:!0}}return r},has(s,e){var l;if(e===A)return!0;var r=f.get(e),n=r!==void 0&&r.v!==o||Reflect.has(s,e);if(r!==void 0||F!==null&&(!n||(l=N(s,e))!=null&&l.writable)){r===void 0&&(r=m(n?I(s[e],c):o),f.set(e,r));var i=P(r);if(i===o)return!1}return n},set(s,e,r,n){var R;var i=f.get(e),l=e in s;if(u&&e==="length")for(var y=r;y<i.v;y+=1){var E=f.get(y+"");E!==void 0?g(E,o):y in s&&(E=m(o),f.set(y+"",E))}i===void 0?(!l||(R=N(s,e))!=null&&R.writable)&&(i=m(void 0),g(i,I(r,c)),f.set(e,i)):(l=i.v!==o,g(i,I(r,c)));var b=Reflect.getOwnPropertyDescriptor(s,e);if(b!=null&&b.set&&b.set.call(n,r),!l){if(u&&typeof e=="string"){var S=f.get("length"),O=Number(e);Number.isInteger(O)&&O>=S.v&&g(S,O+1)}H(d)}return!0},ownKeys(s){P(d);var e=Reflect.ownKeys(s).filter(i=>{var l=f.get(i);return l===void 0||l.v!==o});for(var[r,n]of f)n.v!==o&&!(r in s)&&e.push(r);return e},setPrototypeOf(){W()}})}function H(a,t=1){g(a,a.v+t)}function Se(a){throw new Error("lifecycle_outside_component")}function Ne(a,t,v,h=null,f=!1){q&&ae();var u=a,d=null,c=null,s=null,e=f?re:0;ee(()=>{if(s===(s=!!t()))return;let r=!1;if(q){const n=u.data===te;s===n&&(u=ne(),ie(u),G(!1),r=!0)}s?(d?Y(d):d=U(()=>v(u)),c&&j(c,()=>{c=null})):(c?Y(c):h&&(c=U(()=>h(u))),d&&j(d,()=>{d=null})),r&&G(!0)},e),q&&(u=fe)}function K(a,t){return a===t||(a==null?void 0:a[A])===t}function De(a={},t,v,h){return se(()=>{var f,u;return ue(()=>{f=u,u=[],D(()=>{a!==v(...u)&&(t(a,...u),f&&K(v(...f),a)&&t(null,...f))})}),()=>{le(()=>{u&&K(v(...u),a)&&t(null,...u)})}}),a}function V(a){for(var t=F,v=F;t!==null&&!(t.f&(oe|ye));)t=t.parent;try{return Z(t),a()}finally{Z(v)}}function xe(a,t,v,h){var M;var f=(v&he)!==0,u=!k||(v&be)!==0,d=(v&ge)!==0,c=(v&Ee)!==0,s=!1,e;d?[e,s]=Ie(()=>a[t]):e=a[t];var r=A in a||Pe in a,n=((M=N(a,t))==null?void 0:M.set)??(r&&d&&t in a?_=>a[t]=_:void 0),i=h,l=!0,y=!1,E=()=>(y=!0,l&&(l=!1,c?i=D(h):i=h),i);e===void 0&&h!==void 0&&(n&&u&&_e(),e=E(),n&&n(e));var b;if(u)b=()=>{var _=a[t];return _===void 0?E():(l=!0,y=!1,_)};else{var S=V(()=>(f?$:me)(()=>a[t]));S.f|=ve,b=()=>{var _=P(S);return _!==void 0&&(i=void 0),_===void 0?i:_}}if(!(v&de))return b;if(n){var O=a.$$legacy;return function(_,w){return arguments.length>0?((!u||!w||O||s)&&n(w?b():_),_):b()}}var R=!1,B=!1,x=Re(e),T=V(()=>$(()=>{var _=b(),w=P(x);return R?(R=!1,B=!0,w):(B=!1,x.v=_)}));return f||(T.equals=ce),function(_,w){if(arguments.length>0){const L=w?P(T):u&&d?I(_):_;return T.equals(L)||(R=!0,g(x,L),y&&i!==void 0&&(i=L),D(()=>P(T))),_}return P(T)}}function Le(a){C===null&&Se(),k&&C.l!==null?Oe(C).m.push(a):we(()=>{const t=D(a);if(typeof t=="function")return t})}function Oe(a){var t=a.l;return t.u??(t.u={a:[],b:[],m:[]})}export{I as a,De as b,Ne as i,Le as o,xe as p};
