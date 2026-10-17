'use strict';
(() => {
  const CARD_URL = 'https://titaniumtarps.com/momo.html';
  const CUSTOMER_URL = 'https://titaniumtarps.com/new-customer.html';
  const OFFICE_EMAIL = 'mr@titarps.com';
  // Enable only after Marcelo activates the recipient and confirms delivery.
  const DIRECT_DELIVERY_ENABLED = false;
  const shareDialog = document.querySelector('#share-dialog');
  async function copy(text, status) {
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Ready to paste.'; }
    catch { status.textContent = 'Copy manually: ' + text; }
  }
  async function share(url, title, status) {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    await copy(url, status);
  }
  document.querySelector('[data-share="card"]')?.addEventListener('click', () => shareDialog.showModal());
  shareDialog?.querySelector('.close').addEventListener('click', () => shareDialog.close());
  document.querySelector('#native-share')?.addEventListener('click', () => share(CARD_URL, 'Momo · Titanium Tarps', document.querySelector('#share-status')));
  document.querySelector('#copy-card')?.addEventListener('click', () => copy(CARD_URL, document.querySelector('#share-status')));
  document.querySelector('[data-share="customer"]')?.addEventListener('click', () => share(CUSTOMER_URL, 'New customer · Connected by Momo', document.querySelector('#customer-share-status')));
  const upload = document.querySelector('#open-upload');
  if (upload && new URLSearchParams(location.search).get('crew') !== 'momo') {
    const url = new URL(upload.href); url.searchParams.delete('entry.1604513406'); upload.href = url.href;
  }
  const form = document.querySelector('#customer-form');
  if (!form) return;
  const review = document.querySelector('#customer-review');
  const status = document.querySelector('#customer-status');
  let message = '';
  let deliveryForm = null;
  if (DIRECT_DELIVERY_ENABLED) {
    document.querySelector('#delivery-note').textContent = 'Review your details, then send your request to Marcelo through FormSubmit. FormSubmit processes the details and retains submissions for 30 days. Please wait for its confirmation page.';
    document.querySelector('#review-note').textContent = 'Send opens a secure FormSubmit page in a new tab. Complete any verification and wait for its confirmation. Your details stay here if you need to retry or use email.';
    deliveryForm = document.createElement('form');
    deliveryForm.method='POST'; deliveryForm.action='https://formsubmit.co/'+OFFICE_EMAIL;
    deliveryForm.target='_blank'; deliveryForm.rel='noopener noreferrer';
    deliveryForm.id='direct-delivery';
    document.querySelector('#send-email').before(deliveryForm);
    document.querySelector('#send-email').textContent='Or continue in your email app ↗';
    document.querySelector('#send-email').className='text-link';
  }
  const email = form.elements.email;
  const contact = form.elements.contact;
  for (const key of ['customer','phone','location']) {
    form.elements[key].addEventListener('input', () => form.elements[key].setCustomValidity(''));
  }
  function validateContact() { email.setCustomValidity(contact.value === 'Email' && !email.value.trim() ? 'Please add an email address or choose phone/text.' : ''); }
  email.addEventListener('input', validateContact); contact.addEventListener('change', validateContact);
  form.addEventListener('submit', event => {
    event.preventDefault(); validateContact();
    for (const key of ['customer','phone','location']) {
      form.elements[key].setCustomValidity(form.elements[key].value.trim() ? '' : 'Please enter this information.');
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const entries = [['Connected by','Momo — Jaiteh Momodou Lamin'],['Customer',value('customer')],['Company',value('company')],['Phone',value('phone')],['Email',value('email')],['Project location',value('location')],['Service',value('service')],['Preferred contact',value('contact')],['Project details',value('details')],['Permission','Customer contact permission confirmed']].filter(([,value]) => value);
    const list = document.querySelector('#review-details'); list.replaceChildren();
    for (const [label, value] of entries) { const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;list.append(dt,dd); }
    if (deliveryForm) {
      deliveryForm.replaceChildren();
      const fields = [...entries, ['_subject','TiTarps customer referral from Momo'],['_template','table'],['_url',CUSTOMER_URL]];
      if (value('email')) fields.push(['email',value('email')]);
      for (const [name, value] of fields) {const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;deliveryForm.append(input);}
      const send=document.createElement('button');send.type='submit';send.className='button primary';send.textContent='Send request to Marcelo ↗';deliveryForm.append(send);
    }
    message = 'New customer request — Titanium Tarps\n\n' + entries.map(([label,value])=>label+': '+value).join('\n\n');
    document.querySelector('#send-email').href = 'mailto:'+OFFICE_EMAIL+'?subject='+encodeURIComponent('TiTarps customer referral from Momo')+'&body='+encodeURIComponent(message);
    form.hidden=true;review.hidden=false;status.textContent='';document.querySelector('#review-title').focus();
  });
  document.querySelector('#edit-details').addEventListener('click', () => {review.hidden=true;form.hidden=false;message='';deliveryForm?.replaceChildren();document.querySelector('#send-email').href='mailto:'+OFFICE_EMAIL;form.elements.customer.focus();});
  document.querySelector('#copy-details').addEventListener('click', () => copy(message,status));
})();
