const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const DEFAULT_SCRIPT_URL='https://script.google.com/macros/s/AKfycbxnNIWi4BSKyWZUZcDENr-gbJRtQLudpsIUWJN1mp9S7mLGr13RXJUX-mGQ3ZzlRaNOPw/exec';
const state={type:'invoice'};
const money=n=>new Intl.NumberFormat('en-MW',{style:'currency',currency:$('#currency').value,minimumFractionDigits:2}).format(Number(n)||0);
const numberValue=el=>Math.max(0,Number(el.value)||0);

function addItem(description='',qty=1,rate=0){
  const row=$('#itemTemplate').content.firstElementChild.cloneNode(true);
  row.querySelector('.item-description').value=description;row.querySelector('.item-qty').value=qty;row.querySelector('.item-rate').value=rate;
  row.addEventListener('input',calculate);row.querySelector('.remove-item').addEventListener('click',()=>{row.remove();calculate()});
  $('#itemsBody').append(row);calculate();
}
function calculate(){
  let subtotal=0;$$('#itemsBody tr').forEach(row=>{const amount=numberValue(row.querySelector('.item-qty'))*numberValue(row.querySelector('.item-rate'));subtotal+=amount;row.querySelector('.item-amount').textContent=money(amount)});
  const discount=Math.min(numberValue($('#discount')),subtotal);const taxable=subtotal-discount;const tax=taxable*numberValue($('#taxRate'))/100;const total=taxable+tax;const paid=numberValue($('#amountPaid'));const due=Math.max(0,total-paid);
  $('#subtotal').textContent=money(subtotal);$('#discountTotal').textContent=money(discount);$('#taxTotal').textContent=money(tax);$('#grandTotal').textContent=money(total);$('#paidTotal').textContent=money(paid);$('#amountDue').textContent=money(due);
  return {subtotal,discount,tax,total,amountPaid:paid,amountDue:due};
}
function setType(type){state.type=type;document.body.classList.toggle('receipt-mode',type==='receipt');$('#invoiceType').classList.toggle('active',type==='invoice');$('#receiptType').classList.toggle('active',type==='receipt');$('#documentTitle').textContent=type.toUpperCase();const p=type==='invoice'?'INV':'REC';if(!$('#documentNumber').value||/^(INV|REC)-/.test($('#documentNumber').value))$('#documentNumber').value=`${p}-${String(Date.now()).slice(-6)}`;$('#dueDate').closest('label').style.display=type==='invoice'?'contents':'none';calculate()}
function collect(){const totals=calculate();return {timestamp:new Date().toISOString(),type:state.type,number:$('#documentNumber').value.trim(),date:$('#documentDate').value,dueDate:state.type==='invoice'?$('#dueDate').value:'',businessName:$('#businessName').value.trim(),businessDetails:$('#businessDetails').value.trim(),customerName:$('#customerName').value.trim(),customerDetails:$('#customerDetails').value.trim(),currency:$('#currency').value,taxRate:numberValue($('#taxRate')),notes:$('#notes').value.trim(),items:$$('#itemsBody tr').map(r=>({description:r.querySelector('.item-description').value.trim(),quantity:numberValue(r.querySelector('.item-qty')),rate:numberValue(r.querySelector('.item-rate')),amount:numberValue(r.querySelector('.item-qty'))*numberValue(r.querySelector('.item-rate'))})).filter(i=>i.description),...totals}}
function validate(data){if(!data.number)return'Document number is required.';if(!data.customerName)return'Customer name is required.';if(!data.items.length)return'Add at least one item description.';return''}
async function saveRecord(){const data=collect(),error=validate(data);if(error){alert(error);return false}const url=localStorage.getItem('successPortalScriptUrl')||DEFAULT_SCRIPT_URL;$('#saveStatus').textContent='Saving…';try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});localStorage.setItem('successPortalLastRecord',JSON.stringify(data));$('#saveStatus').textContent='Record sent to Google Sheet';return true}catch(e){$('#saveStatus').textContent='Save failed';alert('Could not send the record. Check the Apps Script deployment and internet connection.');return false}}
async function downloadPdf(){
  const data=collect(),error=validate(data);if(error){alert(error);return}
  if(!window.jspdf){alert('PDF service did not load. Refresh the page and try again.');return}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'}),orange=[255,138,0],ink=[23,33,43],slate=[117,131,145];
  const left=16,right=194,width=178,fmt=n=>money(n).replace(/\u00a0/g,' '),line=(text,x,y,max=80)=>doc.splitTextToSize(String(text||''),max);
  doc.setFillColor(...orange);doc.rect(0,0,140,3,'F');doc.setFillColor(...slate);doc.rect(140,0,70,3,'F');
  try{doc.addImage($('#documentPaper .logo').src,'PNG',16,13,76,25,undefined,'FAST')}catch(e){doc.setTextColor(...orange);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('SUCCESS PORTAL',left,25)}
  doc.setTextColor(...orange);doc.setFont('helvetica','bold');doc.setFontSize(25);doc.text(data.type.toUpperCase(),right,19,{align:'right'});
  doc.setTextColor(...slate);doc.setFontSize(8);doc.text('NO.',145,28);doc.text('DATE',145,34);if(data.type==='invoice')doc.text('DUE',145,40);
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.text(data.number,right,28,{align:'right'});doc.text(data.date,right,34,{align:'right'});if(data.type==='invoice')doc.text(data.dueDate||'-',right,40,{align:'right'});
  doc.setDrawColor(219,225,230);doc.line(left,46,right,46);
  doc.setTextColor(...slate);doc.setFontSize(8);doc.text('ISSUED BY',left,56);doc.text('BILL TO',112,56);
  doc.setTextColor(...ink);doc.setFontSize(13);doc.text(data.businessName||'Success Portal',left,64);doc.text(line(data.customerName,80),112,64);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(83,96,107);doc.text(line(data.businessDetails,left===16?82:82),left,71);doc.text(line(data.customerDetails,80),112,71);
  let y=92;doc.setFillColor(...ink);doc.rect(left,y,width,10,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('DESCRIPTION',left+3,y+6.5);doc.text('QTY',132,y+6.5,{align:'right'});doc.text('RATE',162,y+6.5,{align:'right'});doc.text('AMOUNT',right-3,y+6.5,{align:'right'});y+=10;
  doc.setTextColor(...ink);doc.setFont('helvetica','normal');doc.setFontSize(8.5);
  for(const item of data.items){if(y>222){doc.addPage();y=18}doc.text(line(item.description,95),left+3,y+7);doc.text(String(item.quantity),132,y+7,{align:'right'});doc.text(fmt(item.rate),162,y+7,{align:'right'});doc.setFont('helvetica','bold');doc.text(fmt(item.amount),right-3,y+7,{align:'right'});doc.setFont('helvetica','normal');doc.setDrawColor(219,225,230);doc.line(left,y+11,right,y+11);y+=12}
  y=Math.max(y+8,150);const labelX=139,valueX=191;doc.setFontSize(8);doc.setTextColor(...slate);doc.text('Subtotal',labelX,y);doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.text(fmt(data.subtotal),valueX,y,{align:'right'});y+=8;doc.setFont('helvetica','normal');doc.setTextColor(...slate);doc.text('Discount',labelX,y);doc.setTextColor(...ink);doc.text(fmt(data.discount),valueX,y,{align:'right'});y+=8;doc.setTextColor(...slate);doc.text(`Tax (${data.taxRate}%)`,labelX,y);doc.setTextColor(...ink);doc.text(fmt(data.tax),valueX,y,{align:'right'});y+=5;
  doc.setFillColor(...ink);doc.rect(134,y,60,13,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.text('TOTAL',139,y+8);doc.setFontSize(11);doc.text(fmt(data.total),191,y+8,{align:'right'});y+=18;
  if(data.type==='receipt'){doc.setFontSize(8);doc.setTextColor(...slate);doc.text('Amount paid',139,y);doc.setTextColor(...ink);doc.text(fmt(data.amountPaid),191,y,{align:'right'});y+=5;doc.setDrawColor(...orange);doc.setLineWidth(.6);doc.rect(134,y,60,14);doc.setTextColor(...orange);doc.text('AMOUNT DUE',139,y+9);doc.setFontSize(11);doc.text(fmt(data.amountDue),191,y+9,{align:'right'})}
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...slate);doc.text('NOTES / PAYMENT DETAILS',left,158);doc.text(line(data.notes||'Thank you for your business.',100),left,165);
  doc.setDrawColor(219,225,230);doc.line(left,280,right,280);doc.setTextColor(...orange);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('YOUR GATEWAY TO SUCCESS',left,286);doc.setTextColor(...slate);doc.setFont('helvetica','normal');doc.text('successportal2020@gmail.com | +265 891 677 102',right,286,{align:'right'});
  doc.save(`${data.type}-${data.number}.pdf`);
  await saveRecord();
}
function resetDocument(){if(!confirm('Start a new document? Unsaved entries will be cleared.'))return;$('#customerName').value='';$('#customerDetails').value='';$('#notes').value='';$('#taxRate').value=0;$('#discount').value=0;$('#amountPaid').value=0;$('#itemsBody').innerHTML='';addItem();setType(state.type);$('#documentDate').value=new Date().toISOString().slice(0,10);$('#dueDate').value=new Date(Date.now()+7*864e5).toISOString().slice(0,10);$('#saveStatus').textContent='Ready'}

$('#addItem').addEventListener('click',()=>addItem());$('#invoiceType').addEventListener('click',()=>setType('invoice'));$('#receiptType').addEventListener('click',()=>setType('receipt'));['currency','taxRate','discount','amountPaid'].forEach(id=>$('#'+id).addEventListener('input',calculate));$('#saveButton').addEventListener('click',saveRecord);$('#pdfButton').addEventListener('click',downloadPdf);$('#newButton').addEventListener('click',resetDocument);$('#settingsButton').addEventListener('click',()=>{$('#scriptUrl').value=localStorage.getItem('successPortalScriptUrl')||DEFAULT_SCRIPT_URL;$('#settingsDialog').showModal()});$('#saveSettings').addEventListener('click',()=>{const url=$('#scriptUrl').value.trim();if(url)localStorage.setItem('successPortalScriptUrl',url);$('#saveStatus').textContent=url?'Google Sheet connected':'Connection not set'});
const today=new Date();$('#documentDate').value=today.toISOString().slice(0,10);$('#dueDate').value=new Date(today.getTime()+7*864e5).toISOString().slice(0,10);addItem('Professional service',1,0);setType('invoice');
