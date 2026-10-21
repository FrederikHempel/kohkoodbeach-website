// Pure regression tests: no network calls or actual enquiries.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const src=readFileSync('script.js','utf8');
const code=src.slice(src.indexOf('function redirectToSent('),src.indexOf('/* Swaps the form'));
const values=new Map();let destination;
const context={Date,JSON,Number,URLSearchParams,sessionStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},window:{location:{search:'?utm_source=test&email=private',assign:url=>destination=url}}};
vm.createContext(context);vm.runInContext(code,context);
assert.equal(context.consumeEnquiryReceipt(),null);
context.redirectToSent('booking-enquiry');
assert.equal(destination,'enquiry-sent.html?utm_source=test&kind=booking-enquiry');
assert.equal(context.consumeEnquiryReceipt().fresh,true);
assert.equal(context.consumeEnquiryReceipt().fresh,false);
context.redirectToSent('contact-message');assert.equal(context.consumeEnquiryReceipt().kind,'contact-message');
values.set('kkbr-enquiry-receipt',JSON.stringify({kind:'booking-enquiry',createdAt:Date.now()-1800001,counted:false}));assert.equal(context.consumeEnquiryReceipt(),null);
values.set('kkbr-enquiry-receipt','invalid');assert.equal(context.consumeEnquiryReceipt(),null);
context.sessionStorage.getItem=()=>{throw Error('Storage blocked')};assert.equal(context.consumeEnquiryReceipt(),null);
console.log('PASS: direct visit, success, refresh, contact kind, expiry, corrupt storage, blocked storage, safe URL parameters.');
