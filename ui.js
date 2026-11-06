/* 3T — JavaScript chỉ điều khiển trạng thái hiển thị giao diện.
   Không tìm kiếm, lọc dữ liệu, đăng nhập, đặt hàng, giỏ hàng, quản trị,
   gửi biểu mẫu, gọi API hoặc lưu dữ liệu. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.size-chip').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.size-chip').forEach((chip) => chip.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
  document.querySelectorAll('.swatch').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach((chip) => chip.classList.remove('selected'));
      item.classList.add('selected');
      const label = document.querySelector('.choice-label');
      if (label) label.textContent = item.title || item.getAttribute('aria-label') || 'Màu đã chọn';
    });
  });
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
  });
});
// Đồng bộ trạng thái ẩn sản phẩm từ khu vực quản trị với trang danh sách.
document.addEventListener('DOMContentLoaded', () => {
  try {
    const products = JSON.parse(localStorage.getItem('atelier_products') || '[]');
    const hiddenCodes = new Set(products.filter(p => p.visible === false).map(p => p.code));
    document.querySelectorAll('.product-card').forEach(card => {
      const code = card.querySelector('.product-type')?.textContent.split('/').pop()?.trim();
      if (hiddenCodes.has(code)) card.remove();
    });
    const count = document.querySelector('.product-section .section-head .muted');
    if (count) count.textContent = `${document.querySelectorAll('.product-card').length} SẢN PHẨM`;
  } catch (e) { /* Trang vẫn hiển thị nội dung tĩnh nếu chưa có dữ liệu quản trị. */ }
});


// Điều khiển tăng/giảm số lượng và tự tính tiền trong giao diện giỏ hàng.
document.addEventListener('DOMContentLoaded', () => {
  const money = n => Math.round(n).toLocaleString('vi-VN') + 'đ';
  function updateCart(){
    const rows = [...document.querySelectorAll('.cart-row')];
    let subtotal = 0, count = 0;
    rows.forEach(row => {
      const input = row.querySelector('.qty-input');
      if (!input) return;
      let qty = parseInt(input.value, 10);
      if (!Number.isFinite(qty) || qty < 1) qty = 1;
      if (qty > 99) qty = 99;
      input.value = qty;
      const price = Number(row.querySelector('.unit-price')?.dataset.price || 0);
      const total = price * qty; subtotal += total; count += qty;
      const out = row.querySelector('.row-total'); if(out) out.textContent = money(total);
    });
    const sub = document.getElementById('subtotal'); if(sub) sub.textContent = money(subtotal);
    const grand = document.getElementById('grand-total'); if(grand) grand.textContent = money(subtotal + 30000);
    const badge = document.getElementById('cart-count'); if(badge) badge.textContent = `(${count} sản phẩm)`;
    const titleTotal = document.querySelector('.order-summary .summary-total b');
    if(titleTotal) titleTotal.textContent = money(subtotal + 30000);
  }
  document.querySelectorAll('.qty-control').forEach(control => {
    const input = control.querySelector('.qty-input');
    control.querySelector('.qty-minus')?.addEventListener('click', () => { input.value = Math.max(1, (parseInt(input.value,10)||1)-1); updateCart(); });
    control.querySelector('.qty-plus')?.addEventListener('click', () => { input.value = Math.min(99, (parseInt(input.value,10)||1)+1); updateCart(); });
    input?.addEventListener('input', updateCart); input?.addEventListener('change', updateCart);
  });
  updateCart();
});


// Hiệu ứng thêm vào giỏ hàng: chỉ mô phỏng thông báo thành công,
// không thêm/xóa/sửa dữ liệu và không làm thay đổi trang cart.html.
document.addEventListener('DOMContentLoaded', () => {
  const addButtons = [...document.querySelectorAll('.detail-copy .btn-wide')];
  if (!addButtons.length) return;

  let toastTimer;
  function showCartToast(button) {
    let toast = document.querySelector('.cart-success-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cart-success-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = '<span class="toast-check">✓</span><span><strong>Thêm vào giỏ hàng thành công!</strong></span><button type="button" class="toast-close" aria-label="Đóng">×</button>';
      document.body.appendChild(toast);
      toast.querySelector('.toast-close').addEventListener('click', () => toast.classList.remove('show'));
    }
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    button.classList.add('added-feedback');
    const oldText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = oldText;
    button.textContent = 'ĐÃ THÊM ✓';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
      button.classList.remove('added-feedback');
      button.textContent = oldText;
    }, 2600);
  }
  addButtons.forEach(button => {
    button.type = 'button';
    button.addEventListener('click', () => showCartToast(button));
  });
});

// Hiệu ứng tìm kiếm và lọc sản phẩm: chấp nhận mọi nội dung nhập vào,
// chỉ hiển thị phản hồi giao diện; không lọc, sắp xếp hay thay đổi danh sách sản phẩm.
document.addEventListener('DOMContentLoaded', () => {
  const advanced = document.querySelector('.advanced-search');
  const filter = document.querySelector('.filter-panel');
  if (!advanced && !filter) return;

  let feedbackTimer;
  function showSearchFeedback(message, button) {
    let toast = document.querySelector('.search-feedback-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'search-feedback-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = '<span class="search-feedback-icon">✓</span><strong></strong><button type="button" aria-label="Đóng">×</button>';
      document.body.appendChild(toast);
      toast.querySelector('button').addEventListener('click', () => toast.classList.remove('show'));
    }
    toast.querySelector('strong').textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');

    if (button) {
      const original = button.dataset.originalLabel || button.textContent;
      button.dataset.originalLabel = original;
      button.classList.add('search-button-done');
      button.textContent = 'ĐÃ ÁP DỤNG ✓';
      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(() => {
        toast.classList.remove('show');
        button.classList.remove('search-button-done');
        button.textContent = original;
      }, 2400);
    } else {
      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
    }
  }

  advanced?.querySelector('button')?.addEventListener('click', (event) => {
    event.preventDefault();
    showSearchFeedback('Đã ghi nhận yêu cầu tìm kiếm!', event.currentTarget);
  });

  filter?.querySelector('button')?.addEventListener('click', (event) => {
    event.preventDefault();
    showSearchFeedback('Đã áp dụng bộ lọc sản phẩm!', event.currentTarget);
  });
});
