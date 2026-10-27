(() => {
 const dataUrl = "./elements.json";
 const imageUrl = "./images/";
 const table = document.getElementById('periodic-table');
 const search = document.getElementById('element-search');
 const count = document.getElementById('result-count');
 const empty = document.getElementById('empty-state');
 const modal = document.getElementById('detail-modal');
 const overlay = document.getElementById('modal-overlay');
 let elements = [];
 let activeCategory = 'all';
 const $ = id => document.getElementById(id);
 const clean = value => String(value ?? '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
 function categoryClass(category) {
   const c = clean(category);
   if (c.includes('alkali metal') || c.includes('kim loai kiem')) return 'alkali-metal';
   if (c.includes('alkaline earth') || c.includes('kiem tho')) return 'alkaline-earth';
   if (c.includes('transition metal') || c.includes('kim loai chuyen tiep')) return 'transition-metal';
   if (c.includes('post-transition') || c.includes('hau chuyen tiep')) return 'post-transition';
   if (c.includes('metalloid') || c.includes('a kim')) return 'metalloid';
   if (c.includes('noble gas') || c.includes('khi hiem')) return 'noble-gas';
   if (c.includes('halogen')) return 'nonmetal';
   if (c.includes('lanthanide')) return 'lanthanide';
   if (c.includes('actinide')) return 'actinide';
   if (c.includes('nonmetal') || c.includes('phi kim')) return 'nonmetal';
   if (c.includes('metal') || c.includes('kim loai')) return 'transition-metal';
   return 'unknown';
 }
 function groupOf(el) {
   const cls = categoryClass(el.category);
   if (cls === 'noble-gas') return 'noble';
   if (cls === 'nonmetal') return 'nonmetal';
   if (cls === 'metalloid') return 'metalloid';
   if (['alkali-metal','alkaline-earth','transition-metal','post-transition','lanthanide','actinide'].includes(cls)) return 'metal';
   return 'unknown';
 }
 function translateCategory(category) {
   const c = clean(category);
   if (c.includes('alkali')) return 'Kim loại kiềm';
   if (c.includes('alkaline earth')) return 'Kim loại kiềm thổ';
   if (c.includes('transition metal')) return 'Kim loại chuyển tiếp';
   if (c.includes('post-transition')) return 'Kim loại hậu chuyển tiếp';
   if (c.includes('metalloid') || c.includes('a kim')) return 'Á kim';
   if (c.includes('noble gas') || c.includes('khi hiem')) return 'Khí hiếm';
   if (c.includes('lanthanide')) return 'Họ Lanthanide';
   if (c.includes('actinide')) return 'Họ Actinide';
   if (c.includes('nonmetal') || c.includes('phi kim')) return 'Phi kim';
   if (c.includes('metal') || c.includes('kim loai')) return 'Kim loại';
   return category || 'Chưa phân loại';
 }
 function translatePhase(phase) {
   const p = clean(phase);
   if (p === 'solid' || p === 'the ran') return 'Thể rắn';
   if (p === 'liquid' || p === 'the long') return 'Thể lỏng';
   if (p === 'gas' || p === 'the khi') return 'Thể khí';
   return phase || 'Chưa rõ';
 }
 function makeTile(el) {
   const tile = document.createElement('button');
   tile.type = 'button';
   tile.className = `element-tile ${categoryClass(el.category)}`;
   tile.style.gridColumn = Number(el.xpos) || 1;
   tile.style.gridRow = Number(el.ypos) || 1;
   tile.dataset.category = groupOf(el);
   tile.dataset.search = clean(`${el.name} ${el.symbol} ${el.number} ${el.category}`);
   tile.setAttribute('aria-label', `${el.number} ${el.name}, ký hiệu ${el.symbol}`);
   const num = document.createElement('span'); num.className = 'number'; num.textContent = el.number;
   const symbol = document.createElement('span'); symbol.className = 'symbol'; symbol.textContent = el.symbol;
   const name = document.createElement('span'); name.className = 'name'; name.textContent = el.name;
   tile.append(num, symbol, name);
   tile.addEventListener('click', () => showDetails(el));
   return tile;
 }
 function applyFilters() {
   const term = clean(search.value);
   let visible = 0;
   table.querySelectorAll('.element-tile').forEach(tile => {
     const matchesText = !term || tile.dataset.search.includes(term);
     const matchesCategory = activeCategory === 'all' || tile.dataset.category === activeCategory;
     tile.hidden = !(matchesText && matchesCategory);
     if (!tile.hidden) visible++;
   });
   empty.style.display = visible ? 'none' : 'block';
   count.textContent = `Đang hiển thị ${visible} / ${elements.length} nguyên tố`;
 }
 function setImage(img, candidates) {
   let index = 0;
   img.style.display = 'block';
   img.onerror = () => { index++; if (index < candidates.length) img.src = candidates[index]; else { img.removeAttribute('src'); img.style.display = 'none'; } };
   img.src = candidates[0];
 }
 function showDetails(el) {
   $('modal-number').textContent = el.number;
   $('modal-symbol').textContent = el.symbol;
   $('modal-name-text').textContent = el.name;
   $('modal-mass-text').textContent = `${el.atomic_mass ?? 'Chưa rõ'} u`;
   $('modal-number-text').textContent = el.number;
   $('modal-symbol-text').textContent = el.symbol;
   $('modal-name-val').textContent = el.name;
   $('modal-mass-val').textContent = `${el.atomic_mass ?? 'Chưa rõ'} u`;
   $('modal-category').textContent = translateCategory(el.category);
   $('modal-phase').textContent = translatePhase(el.phase);
   $('modal-config').textContent = el.electron_configuration_semantic || el.electron_configuration || 'Chưa có dữ liệu';
   $('modal-discovered').textContent = el.discovered_by || 'Chưa rõ';
   $('modal-summary').textContent = el.summary || `Khám phá thông tin về ${el.name} (${el.symbol}), nguyên tố có số hiệu nguyên tử ${el.number}.`;
   $('modal-tile-card').className = `modal-card element-preview ${categoryClass(el.category)}`;
   const n = Number(el.number);
   setImage($('modal-img-appearance'), [`${imageUrl}${n}_real.jpg`, `${imageUrl}${n}_real.png`]);
   setImage($('modal-img-bohr'), [`${imageUrl}${n}_bohr.png`, `${imageUrl}${n}_bohr.jpg`]);
   modal.style.display = 'block'; overlay.style.display = 'block';
   document.body.style.overflow = 'hidden'; $('close-modal').focus();
 }
 function closeModal() {
   modal.style.display = 'none'; overlay.style.display = 'none'; document.body.style.overflow = '';
 }
 document.querySelectorAll('.filter-btn').forEach(button => button.addEventListener('click', () => {
   document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === button));
   activeCategory = button.dataset.category; applyFilters();
 }));
 search.addEventListener('input', applyFilters);
 $('close-modal').addEventListener('click', closeModal);
 overlay.addEventListener('click', closeModal);
 document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.style.display === 'block') closeModal(); });
 fetch(dataUrl).then(response => { if (!response.ok) throw new Error('Không tải được dữ liệu'); return response.json(); })
   .then(data => {
     elements = data.elements || data;
     elements.sort((a,b) => Number(a.number) - Number(b.number));
     const fragment = document.createDocumentFragment();
     elements.forEach(el => { if (el.xpos && el.ypos) fragment.appendChild(makeTile(el)); });
     table.appendChild(fragment); applyFilters();
   })
   .catch(error => {
     console.error(error); count.textContent = 'Không tải được dữ liệu. Hãy kiểm tra kết nối hoặc đường dẫn static.';
     empty.style.display = 'block'; empty.textContent = 'Dữ liệu bảng tuần hoàn chưa tải được. Vui lòng tải lại trang.';
   });
})();