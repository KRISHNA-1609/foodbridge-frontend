const API = "https://foodbridge-backend-production.up.railway.app/api";
let token = localStorage.getItem('token');
let currentUser = null;

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      showDashboard();
    } else {
      msg.textContent = data.error || 'Login failed';
    }
  } catch (e) {
    msg.textContent = 'Cannot connect to server. Is backend running?';
  }
}

async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const phone = document.getElementById('reg-phone').value;
  const address = document.getElementById('reg-address').value;
  const msg = document.getElementById('reg-msg');
  msg.textContent = '';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, password, role, phone, address,
        location: { lat: 21.1458, lng: 79.0882 }
      })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      showDashboard();
    } else {
      msg.textContent = data.error || 'Registration failed';
    }
  } catch (e) {
    msg.textContent = 'Cannot connect to server. Is backend running?';
  }
}

function showDashboard() {
  showSection('dashboard');
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-role').textContent = currentUser.role;
  if (currentUser.role === 'donor') {
    document.getElementById('donor-section').classList.remove('hidden');
  }
  fetchListings();
}

async function createListing() {
  const msg = document.getElementById('listing-msg');
  msg.textContent = '';

  const body = {
    title: document.getElementById('food-title').value,
    foodType: document.getElementById('food-type').value,
    quantity: parseInt(document.getElementById('food-quantity').value),
    unit: document.getElementById('food-unit').value,
    address: document.getElementById('food-address').value,
    pickupTime: document.getElementById('food-pickup').value,
    expiryTime: document.getElementById('food-expiry').value,
    location: { type: 'Point', coordinates: [79.0882, 21.1458] }
  };

  const res = await fetch(`${API}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data._id) {
    msg.textContent = '✅ Listing posted successfully!';
    fetchListings();
  } else {
    msg.textContent = data.error || 'Failed to create listing';
    msg.className = 'error';
  }
}

async function fetchListings() {
  const container = document.getElementById('listings-container');
  container.innerHTML = '<p class="muted">Loading...</p>';

  try {
    const res = await fetch(`${API}/listings/nearby?lat=21.1458&lng=79.0882&maxDistance=100000`);
    const data = await res.json();
    if (!data.length) {
      container.innerHTML = '<p class="muted">No food listings found nearby.</p>';
      return;
    }
    container.innerHTML = data.map(l => `
      <div class="food-card">
        <h4>${l.title}</h4>
        <p>Type: ${l.foodType} &nbsp;|&nbsp; Qty: ${l.quantity} ${l.unit}</p>
        <p>📍 ${l.address}</p>
        <p>⏰ Pickup: ${new Date(l.pickupTime).toLocaleString()}</p>
        <p>🕐 Expires: ${new Date(l.expiryTime).toLocaleString()}</p>
        <span class="badge ${l.status}">${l.status}</span>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p class="error">Failed to load listings. Check if backend is running.</p>';
  }
}

function logout() {
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  showSection('login');
}

if (token) {
  fetch(`${API}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (data.user) {
        currentUser = data.user;
        showDashboard();
      } else {
        localStorage.removeItem('token');
        showSection('login');
      }
    })
    .catch(() => {
      localStorage.removeItem('token');
      showSection('login');
    });
} else {
  showSection('login');
}