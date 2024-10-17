const zlib = require('zlib');
const Terser = require("terser");

let replacePageScriptTemplate = `<h1 style="text-align: center" id="loading-tip">正在解压缩页面中</h1><script>!function(){var e=document.createElement("iframe");e.style.position="fixed",e.style.top="0",e.style.left="0",e.style.width="100%",e.style.height="100%",e.style.border="none",document.getElementById("download-tip").parentNode.removeChild(document.getElementById("download-tip"));var t=function(e){var t,n,o,r,d,a;for(t="",o=e.length,n=0;n<o;)switch((r=e[n++])>>4){case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:t+=String.fromCharCode(r);break;case 12:case 13:d=e[n++],t+=String.fromCharCode((31&r)<<6|63&d);break;case 14:d=e[n++],a=e[n++],t+=String.fromCharCode((15&r)<<12|(63&d)<<6|(63&a)<<0)}return t}(new window.Zlib.Inflate(function(e){for(var t=window.ASCII_To_Binary(e),n=t.length,o=new Array(n),r=0;r<n;r++)o[r]=t.charCodeAt(r);return o}(window.base64HtmlContent)).decompress());"srcdoc"in e?e.srcdoc=t:srcDoc.set(e,t),document.body.appendChild(e),document.getElementById("loading-tip").parentNode.removeChild(document.getElementById("loading-tip"))}();</script>`;

let outputContentTemplate = `<h1 style="text-align: center" id="download-tip">正在下载页面中</h1>`;
outputContentTemplate += `<script>`
outputContentTemplate += `/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */(function(){"use strict";var t=void 0,r=this;function i(i,e){var s,h=i.split("."),n=r;!(h[0]in n)&&n.execScript&&n.execScript("var "+h[0]);for(;h.length&&(s=h.shift());)h.length||e===t?n=n[s]?n[s]:n[s]={}:n[s]=e}var e="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array&&"undefined"!=typeof DataView;function s(t){var r,i,s,h,n,a,f,o,l,u,c=t.length,b=0,y=Number.POSITIVE_INFINITY;for(o=0;o<c;++o)t[o]>b&&(b=t[o]),t[o]<y&&(y=t[o]);for(r=1<<b,i=new(e?Uint32Array:Array)(r),s=1,h=0,n=2;s<=b;){for(o=0;o<c;++o)if(t[o]===s){for(a=0,f=h,l=0;l<s;++l)a=a<<1|1&f,f>>=1;for(u=s<<16|o,l=a;l<r;l+=n)i[l]=u;++h}++s,h<<=1,n<<=1}return[i,b,y]}function h(t,r){switch(this.g=[],this.h=32768,this.d=this.f=this.a=this.l=0,this.input=e?new Uint8Array(t):t,this.m=!1,this.i=a,this.r=!1,!r&&(r={})||(r.index&&(this.a=r.index),r.bufferSize&&(this.h=r.bufferSize),r.bufferType&&(this.i=r.bufferType),r.resize&&(this.r=r.resize)),this.i){case n:this.b=32768,this.c=new(e?Uint8Array:Array)(32768+this.h+258);break;case a:this.b=0,this.c=new(e?Uint8Array:Array)(this.h),this.e=this.z,this.n=this.v,this.j=this.w;break;default:throw Error("invalid inflate mode")}}var n=0,a=1,f={t:n,s:a};h.prototype.k=function(){for(;!this.m;){var r=T(this,3);switch(1&r&&(this.m=!0),r>>>=1){case 0:var i=this.input,h=this.a,f=this.c,o=this.b,l=i.length,u=t,b=f.length,y=t;if(this.d=this.f=0,h+1>=l)throw Error("invalid uncompressed block header: LEN");if(u=i[h++]|i[h++]<<8,h+1>=l)throw Error("invalid uncompressed block header: NLEN");if(u===~(i[h++]|i[h++]<<8))throw Error("invalid uncompressed block header: length verify");if(h+u>i.length)throw Error("input buffer is broken");switch(this.i){case n:for(;o+u>f.length;){if(u-=y=b-o,e)f.set(i.subarray(h,h+y),o),o+=y,h+=y;else for(;y--;)f[o++]=i[h++];this.b=o,f=this.e(),o=this.b}break;case a:for(;o+u>f.length;)f=this.e({p:2});break;default:throw Error("invalid inflate mode")}if(e)f.set(i.subarray(h,h+u),o),o+=u,h+=u;else for(;u--;)f[o++]=i[h++];this.a=h,this.b=o,this.c=f;break;case 1:this.j(m,I);break;case 2:var p,d,g,v,w=T(this,5)+257,A=T(this,5)+1,k=T(this,4)+4,U=new(e?Uint8Array:Array)(c.length),E=t,z=t,S=t,j=t,N=t;for(N=0;N<k;++N)U[c[N]]=T(this,3);if(!e)for(N=k,k=U.length;N<k;++N)U[c[N]]=0;for(p=s(U),E=new(e?Uint8Array:Array)(w+A),N=0,v=w+A;N<v;)switch(z=x(this,p),z){case 16:for(j=3+T(this,2);j--;)E[N++]=S;break;case 17:for(j=3+T(this,3);j--;)E[N++]=0;S=0;break;case 18:for(j=11+T(this,7);j--;)E[N++]=0;S=0;break;default:S=E[N++]=z}d=s(e?E.subarray(0,w):E.slice(0,w)),g=s(e?E.subarray(w):E.slice(w)),this.j(d,g);break;default:throw Error("unknown BTYPE: "+r)}}return this.n()};var o,l,u=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],c=e?new Uint16Array(u):u,b=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],y=e?new Uint16Array(b):b,p=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],d=e?new Uint8Array(p):p,g=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],v=e?new Uint16Array(g):g,w=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],A=e?new Uint8Array(w):w,k=new(e?Uint8Array:Array)(288);for(o=0,l=k.length;o<l;++o)k[o]=143>=o?8:255>=o?9:279>=o?7:8;var U,E,m=s(k),z=new(e?Uint8Array:Array)(30);for(U=0,E=z.length;U<E;++U)z[U]=5;var I=s(z);function T(t,r){for(var i,e=t.f,s=t.d,h=t.input,n=t.a,a=h.length;s<r;){if(n>=a)throw Error("input buffer is broken");e|=h[n++]<<s,s+=8}return i=e&(1<<r)-1,t.f=e>>>r,t.d=s-r,t.a=n,i}function x(t,r){for(var i,e,s=t.f,h=t.d,n=t.input,a=t.a,f=n.length,o=r[0],l=r[1];h<l&&!(a>=f);)s|=n[a++]<<h,h+=8;if((e=(i=o[s&(1<<l)-1])>>>16)>h)throw Error("invalid code length: "+e);return t.f=s>>e,t.d=h-e,t.a=a,65535&i}function S(t,r){var i,e;if(this.input=t,this.a=0,!r&&(r={})||(r.index&&(this.a=r.index),r.verify&&(this.A=r.verify)),i=t[this.a++],e=t[this.a++],(15&i)!==j)throw Error("unsupported compression method");if(this.method=j,0!=((i<<8)+e)%31)throw Error("invalid fcheck flag:"+((i<<8)+e)%31);if(32&e)throw Error("fdict flag is not supported");this.q=new h(t,{index:this.a,bufferSize:r.bufferSize,bufferType:r.bufferType,resize:r.resize})}h.prototype.j=function(t,r){var i=this.c,e=this.b;this.o=t;for(var s,h,n,a,f=i.length-258;256!==(s=x(this,t));)if(256>s)e>=f&&(this.b=e,i=this.e(),e=this.b),i[e++]=s;else for(a=y[h=s-257],0<d[h]&&(a+=T(this,d[h])),s=x(this,r),n=v[s],0<A[s]&&(n+=T(this,A[s])),e>=f&&(this.b=e,i=this.e(),e=this.b);a--;)i[e]=i[e++-n];for(;8<=this.d;)this.d-=8,this.a--;this.b=e},h.prototype.w=function(t,r){var i=this.c,e=this.b;this.o=t;for(var s,h,n,a,f=i.length;256!==(s=x(this,t));)if(256>s)e>=f&&(f=(i=this.e()).length),i[e++]=s;else for(a=y[h=s-257],0<d[h]&&(a+=T(this,d[h])),s=x(this,r),n=v[s],0<A[s]&&(n+=T(this,A[s])),e+a>f&&(f=(i=this.e()).length);a--;)i[e]=i[e++-n];for(;8<=this.d;)this.d-=8,this.a--;this.b=e},h.prototype.e=function(){var t,r,i=new(e?Uint8Array:Array)(this.b-32768),s=this.b-32768,h=this.c;if(e)i.set(h.subarray(32768,i.length));else for(t=0,r=i.length;t<r;++t)i[t]=h[t+32768];if(this.g.push(i),this.l+=i.length,e)h.set(h.subarray(s,s+32768));else for(t=0;32768>t;++t)h[t]=h[s+t];return this.b=32768,h},h.prototype.z=function(t){var r,i,s,h=this.input.length/this.a+1|0,n=this.input,a=this.c;return t&&("number"==typeof t.p&&(h=t.p),"number"==typeof t.u&&(h+=t.u)),2>h?i=(s=(n.length-this.a)/this.o[2]/2*258|0)<a.length?a.length+s:a.length<<1:i=a.length*h,e?(r=new Uint8Array(i)).set(a):r=a,this.c=r},h.prototype.n=function(){var t,r,i,s,h,n=0,a=this.c,f=this.g,o=new(e?Uint8Array:Array)(this.l+(this.b-32768));if(0===f.length)return e?this.c.subarray(32768,this.b):this.c.slice(32768,this.b);for(r=0,i=f.length;r<i;++r)for(s=0,h=(t=f[r]).length;s<h;++s)o[n++]=t[s];for(r=32768,i=this.b;r<i;++r)o[n++]=a[r];return this.g=[],this.buffer=o},h.prototype.v=function(){var t,r=this.b;return e?this.r?(t=new Uint8Array(r)).set(this.c.subarray(0,r)):t=this.c.subarray(0,r):(this.c.length>r&&(this.c.length=r),t=this.c),this.buffer=t},S.prototype.k=function(){var t,r,i=this.input;if(t=this.q.k(),this.a=this.q.a,this.A){r=(i[this.a++]<<24|i[this.a++]<<16|i[this.a++]<<8|i[this.a++])>>>0;var e=t;if("string"==typeof e){var s,h,n=e.split("");for(s=0,h=n.length;s<h;s++)n[s]=(255&n[s].charCodeAt(0))>>>0;e=n}for(var a,f=1,o=0,l=e.length,u=0;0<l;){l-=a=1024<l?1024:l;do{o+=f+=e[u++]}while(--a);f%=65521,o%=65521}if(r!==(o<<16|f)>>>0)throw Error("invalid adler-32 checksum")}return t};var j=8;i("Zlib.Inflate",S),i("Zlib.Inflate.prototype.decompress",S.prototype.k);var N,O,q,B,L={ADAPTIVE:f.s,BLOCK:f.t};if(Object.keys)N=Object.keys(L);else for(O in N=[],q=0,L)N[q++]=O;for(q=0,B=N.length;q<B;++q)i("Zlib.Inflate.BufferType."+(O=N[q]),L[O])}).call(this);`
outputContentTemplate += `/*! srcdoc-polyfill - v1.0.0 - 2017-01-29 http://github.com/jugglinmike/srcdoc-polyfill/ Copyright (c) 2017 Mike Pennisi; Licensed MIT */var t,e,o;t=this,e=function(t,e){var o,n,r,c=!!("srcdoc"in document.createElement("iframe")),i="Polyfill may not function in the presence of the \`sandbox\` attribute. Consider using the \`force\` option.",s=/\\ballow-same-origin\\b/,f=function(t,e){var o=t.getAttribute("sandbox");"string"!=typeof o||s.test(o)||(e&&e.force?t.removeAttribute("sandbox"):e&&!1===e.force||(r(i),t.setAttribute("data-srcdoc-polyfill",i)))},d=function(t,e,o){e&&(f(t,o),t.setAttribute("srcdoc",e))},u=function(t,e,o){var n;t&&t.getAttribute&&(e?t.setAttribute("srcdoc",e):e=t.getAttribute("srcdoc"),e&&(f(t,o),n="javascript: window.frameElement.getAttribute('srcdoc');",t.contentWindow&&(t.contentWindow.location=n),t.setAttribute("src",n)))},a=t;if(r=window.console&&window.console.error?function(t){window.console.error("[srcdoc-polyfill] "+t)}:function(){},a.set=d,a.noConflict=function(){return window.srcDoc=e,a},!c)for(a.set=u,o=(n=document.getElementsByTagName("iframe")).length;o--;)a.set(n[o])},o=window.srcDoc,"function"==typeof define&&define.amd?define(["exports"],(function(n){e(n,o),t.srcDoc=n})):"object"==typeof exports?e(exports,o):(t.srcDoc={},e(t.srcDoc,o));`;
outputContentTemplate += `/* https://github.com/davidchambers/Base64.js/blob/master/base64.js */window.ASCII_To_Binary=function(r){var e=String(r).replace(/[=]+$/,"");if(e.length%4==1){var n=function(){this.message="'atob' failed: The string to be decoded is not correctly encoded."};throw(n.prototype=new Error).name="InvalidCharacterError",new n}for(var o,t,a=0,i=0,d="";t=e.charAt(i++);~t&&(o=a%4?64*o+t:t,a++%4)?d+=String.fromCharCode(255&o>>(-2*a&6)):0)t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t);return d};`
outputContentTemplate += `</script>`;

function compressFileToDeflate(inputFileData) {
    return new Promise(async (resolve, reject) => {
        try {
            // 创建 deflate 压缩
            const compressedData = zlib.deflateSync(inputFileData, {level: zlib.constants.Z_BEST_COMPRESSION});

            // 将压缩的 Buffer 转换为 base64 字符串
            const base64String = compressedData.toString('base64');

            // 写入输出文件
            let outputContent = outputContentTemplate;

            outputContent += `<script>window.base64HtmlContent="${base64String}";</script>`;

            outputContent += replacePageScriptTemplate;

            // 将字符串转换为 Buffer
            const buffer1 = Buffer.byteLength(outputContent);
            const buffer2 = Buffer.byteLength(inputFileData);
            // console.log(buffer1,buffer2);
            // 比较两个字符串并保存较小的字符串
            let smallerString;

            if (buffer1 < buffer2) {
                smallerString = outputContent;
            } else {
                smallerString = inputFileData;
            }

            resolve(smallerString);
            console.log('文件压缩完成为deflate');
        } catch (err) {
            // console.error('文件压缩为deflate过程中发生错误:', err);
            reject('文件压缩为deflate过程中发生错误:' + err);
        }
    });
}

module.exports = compressFileToDeflate;