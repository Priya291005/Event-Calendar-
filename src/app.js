/**
 * Event Calendar Website - Vanilla JavaScript Engine
 * Author: CSE Student Project
 * Description: Pure Vanilla JavaScript event management application featuring
 * monthly calendar rendering, persistent local storage, modal CRUD operations,
 * search & category filtering, and validation.
 */

// ============================================================================
// 1. Data Store & Sample Pre-seeding
// ============================================================================
const STORAGE_KEY = 'event_calendar_events_v1';

// Base sample events for college CSE resume portfolio demonstration
const INITIAL_SAMPLE_EVENTS = [
  {
    id: 'evt_sample_1',
    title: 'College Project Review',
    date: '2026-10-08',
    startTime: '10:00',
    endTime: '12:00',
    category: 'College',
    location: 'CSE Department Seminar Hall',
    description: 'Presentation of Phase 1 system architecture and database design to project guides.',
    createdAt: '2026-10-01T09:00:00.000Z'
  },
  {
    id: 'evt_sample_2',
    title: 'Placement Training',
    date: '2026-10-12',
    startTime: '09:00',
    endTime: '13:00',
    category: 'College',
    location: 'Auditorium & Lab 2',
    description: 'Technical aptitude and mock coding interview sessions for upcoming campus recruitment.',
    createdAt: '2026-10-01T09:30:00.000Z'
  },
  {
    id: 'evt_sample_3',
    title: 'Team Meeting',
    date: '2026-10-15',
    startTime: '15:00',
    endTime: '16:30',
    category: 'Meeting',
    location: 'Google Meet',
    description: 'Sprint review and task assignment for the calendar module deliverables.',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'evt_sample_4',
    title: 'Birthday Celebration',
    date: '2026-10-18',
    startTime: '19:00',
    endTime: '22:00',
    category: 'Birthday',
    location: 'Skyline Bistro',
    description: 'Celebrating Rahul\'s birthday with college batchmates and friends.',
    createdAt: '2026-10-01T11:00:00.000Z'
  },
  {
    id: 'evt_sample_5',
    title: 'Hackathon 2026',
    date: '2026-10-24',
    startTime: '08:00',
    endTime: '20:00',
    category: 'College',
    location: 'Innovation Hub, Block 4',
    description: '24-hour national student hackathon on smart campus and web development.',
    createdAt: '2026-10-01T12:00:00.000Z'
  },
  {
    id: 'evt_sample_6',
    title: 'DSA Practice & Portfolio',
    date: '2026-10-28',
    startTime: '18:00',
    endTime: '20:00',
    category: 'Personal',
    location: 'Central Library, Desk 14',
    description: 'Solve dynamic programming problems on LeetCode and polish GitHub portfolio.',
    createdAt: '2026-10-01T13:00:00.000Z'
  }
];

// App State
const state = {
  events: [],
  // Reference date: current system date (e.g. October 2026)
  currentDate: new Date(),
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-indexed (9 for October)
  selectedDate: null, // 'YYYY-MM-DD' or null
  activeCategory: 'All',
  activeTimeframe: 'all',
  searchQuery: '',
  eventToDeleteId: null
};

// ============================================================================
// 2. LocalStorage Helpers
// ============================================================================
function loadEventsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveEventsToStorage(INITIAL_SAMPLE_EVENTS);
      return [...INITIAL_SAMPLE_EVENTS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array saved, re-seed
    saveEventsToStorage(INITIAL_SAMPLE_EVENTS);
    return [...INITIAL_SAMPLE_EVENTS];
  } catch (err) {
    console.warn('Failed to parse localStorage data, using fallback sample events:', err);
    return [...INITIAL_SAMPLE_EVENTS];
  }
}

function saveEventsToStorage(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

// ============================================================================
// 3. Date & Format Utilities
// ============================================================================
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function padZero(num) {
  return String(num).padStart(2, '0');
}

function formatDateISO(year, monthIndex, day) {
  return `${year}-${padZero(monthIndex + 1)}-${padZero(day)}`;
}

function formatReadableDate(isoString) {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = MONTH_NAMES[month] || '';
  return `${monthName} ${day}, ${year}`;
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minStr || '00'} ${ampm}`;
}

function getTodayISO() {
  const now = state.currentDate;
  return formatDateISO(now.getFullYear(), now.getMonth(), now.getDate());
}

// ============================================================================
// 4. UI Toast Notification System
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // Trigger smooth entrance
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after 3.2s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 3200);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 5. Calendar Engine & Renderer
// ============================================================================
function renderCalendar() {
  const monthYearDisplay = document.getElementById('month-year-display');
  const calendarDaysContainer = document.getElementById('calendar-days');
  if (!monthYearDisplay || !calendarDaysContainer) return;

  const year = state.viewYear;
  const month = state.viewMonth;

  // Header Title: e.g. "October 2026"
  monthYearDisplay.textContent = `${MONTH_NAMES[month]} ${year}`;

  // First day of current month (0: Sunday, 1: Monday, ..., 6: Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const prevMonthDays = new Date(year, month, 0).getDate();

  const todayISO = getTodayISO();

  // Clear previous grid
  calendarDaysContainer.innerHTML = '';

  // 1. Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthIndex = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateISO = formatDateISO(prevYear, prevMonthIndex, dayNum);

    const cell = createDayCell(dayNum, dateISO, true, false, dateISO === state.selectedDate);
    calendarDaysContainer.appendChild(cell);
  }

  // 2. Days of current month
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dateISO = formatDateISO(year, month, dayNum);
    const isToday = dateISO === todayISO;
    const isSelected = dateISO === state.selectedDate;

    const cell = createDayCell(dayNum, dateISO, false, isToday, isSelected);
    calendarDaysContainer.appendChild(cell);
  }

  // 3. Leading days of next month to complete standard grid (35 or 42 cells)
  const totalCellsRendered = firstDayIndex + totalDays;
  const remainingSlots = totalCellsRendered <= 35 ? 35 - totalCellsRendered : 42 - totalCellsRendered;

  for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
    const nextMonthIndex = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateISO = formatDateISO(nextYear, nextMonthIndex, dayNum);

    const cell = createDayCell(dayNum, dateISO, true, false, dateISO === state.selectedDate);
    calendarDaysContainer.appendChild(cell);
  }

  updateSelectedDateBanner();
}

function createDayCell(dayNumber, dateISO, isOtherMonth, isToday, isSelected) {
  const cell = document.createElement('div');
  cell.className = 'day-cell';
  cell.setAttribute('tabindex', '0');
  cell.setAttribute('role', 'gridcell');
  cell.setAttribute('data-date', dateISO);

  if (isOtherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('is-today');
  if (isSelected) cell.classList.add('is-selected');

  // Filter events belonging to this exact date
  const dayEvents = state.events.filter(e => e.date === dateISO);

  const headerDiv = document.createElement('div');
  headerDiv.className = 'day-header';

  const numSpan = document.createElement('span');
  numSpan.className = 'day-number tabular-nums';
  numSpan.textContent = dayNumber;
  headerDiv.appendChild(numSpan);

  if (dayEvents.length > 0) {
    const countSpan = document.createElement('span');
    countSpan.className = 'day-events-count tabular-nums';
    countSpan.textContent = `${dayEvents.length}`;
    headerDiv.appendChild(countSpan);
  }

  cell.appendChild(headerDiv);

  // Events list inside cell
  if (dayEvents.length > 0) {
    const eventsListDiv = document.createElement('div');
    eventsListDiv.className = 'day-events-list';

    // Show up to 2 chips
    const maxChips = 2;
    dayEvents.slice(0, maxChips).forEach(ev => {
      const chip = document.createElement('div');
      const catClass = `chip-${(ev.category || 'other').toLowerCase()}`;
      chip.className = `event-chip ${catClass}`;
      chip.title = `${ev.title} (${ev.startTime || 'All day'})`;

      chip.innerHTML = `
        <span class="chip-dot"></span>
        <span class="chip-title">${escapeHTML(ev.title)}</span>
      `;

      // Clicking chip directly opens edit
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditEventModal(ev.id);
      });

      eventsListDiv.appendChild(chip);
    });

    if (dayEvents.length > maxChips) {
      const moreChip = document.createElement('div');
      moreChip.className = 'more-events-chip';
      moreChip.textContent = `+${dayEvents.length - maxChips} more`;
      eventsListDiv.appendChild(moreChip);
    }

    cell.appendChild(eventsListDiv);
  }

  // Cell Click Interaction:
  // If user clicks a date cell, select it to filter events list below.
  // Double-clicking opens Add Event modal prefilled with that date!
  cell.addEventListener('click', () => {
    handleDayClick(dateISO);
  });

  cell.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    openAddEventModal(dateISO);
  });

  cell.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(dateISO);
    }
  });

  return cell;
}

function handleDayClick(dateISO) {
  // Toggle selection
  if (state.selectedDate === dateISO) {
    state.selectedDate = null;
  } else {
    state.selectedDate = dateISO;
  }

  renderCalendar();
  renderEventsList();
  updateMetrics();

  // Scroll smoothly to events section if a date was selected
  if (state.selectedDate) {
    const eventsSec = document.getElementById('events-section');
    if (eventsSec) {
      eventsSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function updateSelectedDateBanner() {
  const bannerLabel = document.getElementById('selected-date-label');
  const clearBtn = document.getElementById('btn-clear-date-filter');
  const addOnDateBtn = document.getElementById('btn-add-on-date');
  if (!bannerLabel || !clearBtn) return;

  if (state.selectedDate) {
    bannerLabel.textContent = formatReadableDate(state.selectedDate);
    clearBtn.hidden = false;
    if (addOnDateBtn) addOnDateBtn.hidden = false;
  } else {
    bannerLabel.textContent = `All Days in ${MONTH_NAMES[state.viewMonth]} ${state.viewYear}`;
    clearBtn.hidden = true;
    if (addOnDateBtn) addOnDateBtn.hidden = true;
  }
}

// ============================================================================
// 6. Events List, Cards & Filter Engine
// ============================================================================
function getFilteredEvents() {
  const todayISO = getTodayISO();

  return state.events.filter(ev => {
    // 1. Selected calendar date filter
    if (state.selectedDate && ev.date !== state.selectedDate) {
      return false;
    }

    // 2. Category filter
    if (state.activeCategory !== 'All') {
      if ((ev.category || 'Other').toLowerCase() !== state.activeCategory.toLowerCase()) {
        return false;
      }
    }

    // 3. Timeframe filter
    if (state.activeTimeframe === 'upcoming') {
      if (ev.date < todayISO) return false;
    } else if (state.activeTimeframe === 'past') {
      if (ev.date >= todayISO) return false;
    } else if (state.activeTimeframe === 'this-month') {
      const [y, m] = ev.date.split('-');
      if (parseInt(y, 10) !== state.viewYear || parseInt(m, 10) - 1 !== state.viewMonth) {
        return false;
      }
    }

    // 4. Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const titleMatch = ev.title.toLowerCase().includes(q);
      const locMatch = (ev.location || '').toLowerCase().includes(q);
      const descMatch = (ev.description || '').toLowerCase().includes(q);
      if (!titleMatch && !locMatch && !descMatch) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort by date ascending, then startTime
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

function renderEventsList() {
  const gridContainer = document.getElementById('events-grid-container');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const resetFiltersBtn = document.getElementById('btn-reset-all-filters');

  if (!gridContainer || !emptyState || !resultsCount) return;

  const filtered = getFilteredEvents();

  // Results count
  const eventWord = filtered.length === 1 ? 'event' : 'events';
  resultsCount.textContent = `Showing ${filtered.length} ${eventWord}`;

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    state.selectedDate ||
    state.activeCategory !== 'All' ||
    state.activeTimeframe !== 'all' ||
    state.searchQuery
  );

  if (resetFiltersBtn) {
    resetFiltersBtn.hidden = !hasActiveFilters;
  }

  // Clear current items
  gridContainer.innerHTML = '';

  if (filtered.length === 0) {
    gridContainer.style.display = 'none';
    emptyState.hidden = false;

    const emptyDesc = document.getElementById('empty-state-desc');
    if (emptyDesc) {
      if (state.selectedDate) {
        emptyDesc.textContent = `No events scheduled for ${formatReadableDate(state.selectedDate)}. Click "Add New Event" to schedule one.`;
      } else if (state.searchQuery || state.activeCategory !== 'All' || state.activeTimeframe !== 'all') {
        emptyDesc.textContent = 'No events match your current search or category filter. Try clearing filters.';
      } else {
        emptyDesc.textContent = 'No events created yet. Start planning by adding your first event.';
      }
    }
    return;
  }

  gridContainer.style.display = 'grid';
  emptyState.hidden = true;

  filtered.forEach(ev => {
    const card = createEventCard(ev);
    gridContainer.appendChild(card);
  });
}

function createEventCard(ev) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.setAttribute('data-id', ev.id);

  const cat = ev.category || 'Other';
  const catKey = cat.toLowerCase();

  // Time formatting
  let timeStr = '';
  if (ev.startTime && ev.endTime) {
    timeStr = `${formatTimeDisplay(ev.startTime)} - ${formatTimeDisplay(ev.endTime)}`;
  } else if (ev.startTime) {
    timeStr = formatTimeDisplay(ev.startTime);
  } else {
    timeStr = 'All Day';
  }

  const formattedDate = formatReadableDate(ev.date);

  card.innerHTML = `
    <div class="card-top">
      <div class="card-header-row">
        <span class="category-badge cat-${catKey}">
          <span class="legend-dot dot-${catKey}"></span>
          ${escapeHTML(cat)}
        </span>
      </div>
      <h3 class="card-title">${escapeHTML(ev.title)}</h3>

      <div class="card-meta-list">
        <div class="meta-item">
          <svg class="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span class="tabular-nums font-semibold">${escapeHTML(formattedDate)}</span>
        </div>

        <div class="meta-item">
          <svg class="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="tabular-nums">${escapeHTML(timeStr)}</span>
        </div>

        ${ev.location ? `
          <div class="meta-item">
            <svg class="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHTML(ev.location)}</span>
          </div>
        ` : ''}
      </div>

      ${ev.description ? `
        <div class="card-description">
          ${escapeHTML(ev.description)}
        </div>
      ` : ''}
    </div>

    <div class="card-actions">
      <button class="btn-card-action action-edit" data-id="${ev.id}" title="Edit event">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <span>Edit</span>
      </button>
      <button class="btn-card-action action-delete" data-id="${ev.id}" title="Delete event">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Delete</span>
      </button>
    </div>
  `;

  // Attach event handlers for Edit & Delete
  const editBtn = card.querySelector('.action-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => openEditEventModal(ev.id));
  }

  const deleteBtn = card.querySelector('.action-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => openDeleteConfirmModal(ev.id));
  }

  return card;
}

// ============================================================================
// 7. Metrics Updates
// ============================================================================
function updateMetrics() {
  const statTotal = document.getElementById('stat-total-events');
  const statMonth = document.getElementById('stat-month-events');
  const statUpcoming = document.getElementById('stat-upcoming-events');
  const statCats = document.getElementById('stat-categories-count');

  if (!statTotal) return;

  const todayISO = getTodayISO();
  const currentMonthPrefix = `${state.viewYear}-${padZero(state.viewMonth + 1)}`;

  const total = state.events.length;
  const thisMonthCount = state.events.filter(e => e.date.startsWith(currentMonthPrefix)).length;
  const upcomingCount = state.events.filter(e => e.date >= todayISO).length;

  // Distinct categories count
  const catsSet = new Set(state.events.map(e => e.category || 'Other'));

  statTotal.textContent = String(total);
  statMonth.textContent = String(thisMonthCount);
  statUpcoming.textContent = String(upcomingCount);
  if (statCats) {
    statCats.textContent = String(Math.max(catsSet.size, 5));
  }
}

// ============================================================================
// 8. Add & Edit Event Modal Management
// ============================================================================
const modalOverlay = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const modalTitle = document.getElementById('modal-title');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalValidationError = document.getElementById('modal-validation-error');
const validationErrorText = document.getElementById('validation-error-text');

// Form input references
const eventIdInput = document.getElementById('event-id-input');
const eventTitleInput = document.getElementById('event-title-input');
const eventDateInput = document.getElementById('event-date-input');
const eventCatSelect = document.getElementById('event-category-select');
const eventStartTimeInput = document.getElementById('event-start-time-input');
const eventEndTimeInput = document.getElementById('event-end-time-input');
const eventLocationInput = document.getElementById('event-location-input');
const eventDescInput = document.getElementById('event-desc-input');

function openAddEventModal(prefilledDate = null) {
  clearValidationErrors();
  eventForm.reset();
  eventIdInput.value = '';

  modalTitle.textContent = 'Add New Event';
  modalSubmitBtn.textContent = 'Add Event';

  // Default date: passed in prefilledDate, or selectedDate, or today's date
  const defaultDate = prefilledDate || state.selectedDate || getTodayISO();
  eventDateInput.value = defaultDate;
  eventCatSelect.value = 'College';

  openModal(modalOverlay);
  setTimeout(() => eventTitleInput.focus(), 50);
}

function openEditEventModal(eventId) {
  const ev = state.events.find(e => e.id === eventId);
  if (!ev) return;

  clearValidationErrors();
  eventForm.reset();

  eventIdInput.value = ev.id;
  eventTitleInput.value = ev.title || '';
  eventDateInput.value = ev.date || '';
  eventCatSelect.value = ev.category || 'College';
  eventStartTimeInput.value = ev.startTime || '';
  eventEndTimeInput.value = ev.endTime || '';
  eventLocationInput.value = ev.location || '';
  eventDescInput.value = ev.description || '';

  modalTitle.textContent = 'Edit Event';
  modalSubmitBtn.textContent = 'Update Event';

  openModal(modalOverlay);
  setTimeout(() => eventTitleInput.focus(), 50);
}

function closeEventModal() {
  closeModal(modalOverlay);
  clearValidationErrors();
  eventForm.reset();
  eventIdInput.value = '';
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function clearValidationErrors() {
  if (modalValidationError) modalValidationError.hidden = true;
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
}

function validateEventForm() {
  clearValidationErrors();
  let isValid = true;
  const errors = [];

  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  const startTime = eventStartTimeInput.value;
  const endTime = eventEndTimeInput.value;

  // 1. Title validation
  if (!title) {
    isValid = false;
    eventTitleInput.classList.add('input-error');
    const titleErr = document.getElementById('title-error');
    if (titleErr) {
      titleErr.textContent = 'Event title is required.';
      titleErr.classList.add('visible');
    }
    errors.push('Event title is required.');
  }

  // 2. Date validation
  if (!date) {
    isValid = false;
    eventDateInput.classList.add('input-error');
    const dateErr = document.getElementById('date-error');
    if (dateErr) {
      dateErr.textContent = 'Please choose a valid date.';
      dateErr.classList.add('visible');
    }
    errors.push('Event date is required.');
  }

  // 3. Time validation (if both start & end time are provided)
  if (startTime && endTime) {
    if (endTime < startTime) {
      isValid = false;
      eventEndTimeInput.classList.add('input-error');
      const timeErr = document.getElementById('time-error');
      if (timeErr) {
        timeErr.textContent = 'End time cannot be earlier than start time.';
        timeErr.classList.add('visible');
      }
      errors.push('End time must be later than or equal to start time.');
    }
  }

  if (!isValid && modalValidationError && validationErrorText) {
    modalValidationError.hidden = false;
    validationErrorText.textContent = errors[0] || 'Please fix the errors before submitting.';
  }

  return isValid;
}

function handleEventFormSubmit(e) {
  e.preventDefault();

  if (!validateEventForm()) {
    return;
  }

  const id = eventIdInput.value;
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  const category = eventCatSelect.value;
  const startTime = eventStartTimeInput.value;
  const endTime = eventEndTimeInput.value;
  const location = eventLocationInput.value.trim();
  const description = eventDescInput.value.trim();

  if (id) {
    // Update existing event
    const idx = state.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      state.events[idx] = {
        ...state.events[idx],
        title,
        date,
        category,
        startTime,
        endTime,
        location,
        description,
        updatedAt: new Date().toISOString()
      };
      saveEventsToStorage(state.events);
      showToast(`Updated "${title}" successfully`, 'success');
    }
  } else {
    // Add new event
    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title,
      date,
      category,
      startTime,
      endTime,
      location,
      description,
      createdAt: new Date().toISOString()
    };
    state.events.push(newEvent);
    saveEventsToStorage(state.events);
    showToast(`Added "${title}" to your calendar`, 'success');
  }

  closeEventModal();

  // If the added/edited date is in a different month, navigate calendar to that month
  const [eventY, eventM] = date.split('-');
  const eventYearNum = parseInt(eventY, 10);
  const eventMonthNum = parseInt(eventM, 10) - 1;
  if (!isNaN(eventYearNum) && !isNaN(eventMonthNum)) {
    state.viewYear = eventYearNum;
    state.viewMonth = eventMonthNum;
  }

  renderCalendar();
  renderEventsList();
  updateMetrics();
}

// ============================================================================
// 9. Delete Confirmation Modal Management
// ============================================================================
const deleteModal = document.getElementById('delete-modal');
const deleteEventName = document.getElementById('delete-event-name');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');

function openDeleteConfirmModal(eventId) {
  const ev = state.events.find(e => e.id === eventId);
  if (!ev) return;

  state.eventToDeleteId = eventId;
  if (deleteEventName) {
    deleteEventName.textContent = `"${ev.title}"`;
  }

  openModal(deleteModal);
}

function closeDeleteModal() {
  closeModal(deleteModal);
  state.eventToDeleteId = null;
}

function handleConfirmDelete() {
  if (!state.eventToDeleteId) return;

  const ev = state.events.find(e => e.id === state.eventToDeleteId);
  const title = ev ? ev.title : 'Event';

  state.events = state.events.filter(e => e.id !== state.eventToDeleteId);
  saveEventsToStorage(state.events);

  closeDeleteModal();
  showToast(`Deleted "${title}"`, 'danger');

  renderCalendar();
  renderEventsList();
  updateMetrics();
}

// ============================================================================
// 10. Navigation & Month Switching
// ============================================================================
function changeMonth(delta) {
  state.viewMonth += delta;
  if (state.viewMonth < 0) {
    state.viewMonth = 11;
    state.viewYear -= 1;
  } else if (state.viewMonth > 11) {
    state.viewMonth = 0;
    state.viewYear += 1;
  }

  renderCalendar();
  renderEventsList();
  updateMetrics();
}

function jumpToToday() {
  const now = state.currentDate;
  state.viewYear = now.getFullYear();
  state.viewMonth = now.getMonth();
  state.selectedDate = getTodayISO();

  renderCalendar();
  renderEventsList();
  updateMetrics();

  showToast(`Showing Today: ${formatReadableDate(state.selectedDate)}`, 'info');
}

// ============================================================================
// 11. Search & Filter Handlers
// ============================================================================
function initFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const catTabs = document.querySelectorAll('.cat-tab');
  const timeFilter = document.getElementById('time-filter-select');
  const resetFiltersBtn = document.getElementById('btn-reset-all-filters');
  const emptyClearBtn = document.getElementById('empty-clear-btn');
  const clearDateFilterBtn = document.getElementById('btn-clear-date-filter');

  // Live Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.hidden = !state.searchQuery;
      }
      renderEventsList();
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.hidden = true;
      renderEventsList();
      searchInput.focus();
    });
  }

  // Category Tabs
  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      state.activeCategory = tab.getAttribute('data-category') || 'All';
      renderEventsList();
    });
  });

  // Timeframe Select
  if (timeFilter) {
    timeFilter.addEventListener('change', (e) => {
      state.activeTimeframe = e.target.value;
      renderEventsList();
    });
  }

  // Reset all filters button
  function resetAllFilters() {
    state.searchQuery = '';
    state.activeCategory = 'All';
    state.activeTimeframe = 'all';
    state.selectedDate = null;

    if (searchInput) {
      searchInput.value = '';
      if (searchClearBtn) searchClearBtn.hidden = true;
    }

    if (timeFilter) {
      timeFilter.value = 'all';
    }

    catTabs.forEach(t => {
      const isAll = t.getAttribute('data-category') === 'All';
      t.classList.toggle('active', isAll);
      t.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    renderCalendar();
    renderEventsList();
    updateMetrics();
    showToast('Filters cleared', 'info');
  }

  if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', resetAllFilters);

  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener('click', () => {
      state.selectedDate = null;
      renderCalendar();
      renderEventsList();
      updateMetrics();
    });
  }
}

// ============================================================================
// 12. Setup Global Listeners & App Initialization
// ============================================================================
function initEventListeners() {
  // Month Controls
  const prevBtn = document.getElementById('btn-prev-month');
  const nextBtn = document.getElementById('btn-next-month');
  const todayBtn = document.getElementById('btn-today');

  if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
  if (todayBtn) todayBtn.addEventListener('click', jumpToToday);

  // Add Event Buttons
  const openAddModalBtn = document.getElementById('open-add-modal-btn');
  const mobileAddBtn = document.getElementById('mobile-add-btn');
  const heroCreateBtn = document.getElementById('hero-create-btn');
  const addSecondaryBtn = document.getElementById('btn-add-event-secondary');
  const emptyAddBtn = document.getElementById('empty-add-event-btn');
  const addOnDateBtn = document.getElementById('btn-add-on-date');

  const openAddHandler = () => openAddEventModal();
  if (openAddModalBtn) openAddModalBtn.addEventListener('click', openAddHandler);
  if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', () => {
      closeMobileMenu();
      openAddEventModal();
    });
  }
  if (heroCreateBtn) heroCreateBtn.addEventListener('click', openAddHandler);
  if (addSecondaryBtn) addSecondaryBtn.addEventListener('click', openAddHandler);
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddHandler);
  if (addOnDateBtn) {
    addOnDateBtn.addEventListener('click', () => {
      openAddEventModal(state.selectedDate);
    });
  }

  // Modal Cancel / Close Buttons
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeEventModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeEventModal);

  // Form Submit
  if (eventForm) {
    eventForm.addEventListener('submit', handleEventFormSubmit);
  }

  // Delete Modal Buttons
  if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDeleteModal);
  if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', handleConfirmDelete);

  // Close modals on overlay backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeEventModal();
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Keyboard accessibility: ESC closes active modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOverlay.classList.contains('open')) closeEventModal();
      if (deleteModal.classList.contains('open')) closeDeleteModal();
    }
  });

  // Mobile Navigation Hamburger Toggle
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    const isHidden = mobileMenu.hidden;
    mobileMenu.hidden = !isHidden;
    if (mobileToggleBtn) {
      mobileToggleBtn.setAttribute('aria-expanded', String(isHidden));
    }
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    if (mobileToggleBtn) {
      mobileToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', toggleMobileMenu);
  }

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Reset Sample Events Button (Footer)
  const resetSampleBtn = document.getElementById('btn-reset-sample-data');
  if (resetSampleBtn) {
    resetSampleBtn.addEventListener('click', () => {
      saveEventsToStorage(INITIAL_SAMPLE_EVENTS);
      state.events = [...INITIAL_SAMPLE_EVENTS];
      state.selectedDate = null;
      renderCalendar();
      renderEventsList();
      updateMetrics();
      showToast('Sample events reloaded successfully', 'success');
    });
  }

  // Active navigation highlight on scroll
  window.addEventListener('scroll', () => {
    const sections = ['home', 'calendar-section', 'events-section'];
    const scrollPos = window.scrollY + 120;

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.nav-link').forEach(link => {
            const isMatch = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isMatch);
          });
        }
      }
    });
  }, { passive: true });
}

// Main App Initialization
function initApp() {
  state.events = loadEventsFromStorage();
  
  initEventListeners();
  initFilterListeners();
  
  renderCalendar();
  renderEventsList();
  updateMetrics();
}

// Bootstrap once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
