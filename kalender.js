// Globale Variablen
let selectedDate = null;
let selectedTimeSlot = null;

// Aktualisiert die Uhr und das Datum
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeText = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock').textContent = timeText;

    const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const weekday = weekdays[now.getDay()];
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('de-DE', { month: 'long' });
    const year = now.getFullYear();
    const dateText = `${weekday}, ${day}. ${month} ${year}`;
    document.getElementById('date').textContent = dateText;
 }

setInterval(updateClock, 1000);
window.onload = updateClock;

function getTotalAppointmentsForDay(date) {
return fetch(`http://localhost:3001/appointments?date=${date}`)
.then(function(response) { return response.json(); })
.then(function(data) {
    return data.length;
})
.catch(function(error) {
    console.error('Fehler beim Laden der Tages-Termine:', error);
    return 0;
});
}

// Überprüft, ob ein Zeitslot voll ist
function isSlotFull(appointments, slot) {
    return appointments.filter(function(appointment) { return appointment.time === slot; }).length >= 3;
}

// Lädt die Termine für einen bestimmten Tag
function loadAppointments(date) {
fetch(`http://localhost:3001/appointments?date=${date}`)
.then(response => response.json())
.then(data => {
    const timeSlots = ['6-10', '11-15', '16-20', '21-00'];
    timeSlots.forEach(slot => {
        const button = document.querySelector(`.time-slot-button[data-time="${slot}"]`);
        const appointmentCount = getAppointmentCount(data, slot);
        updateButtonColor(button, appointmentCount);
    });
})
.catch(error => console.error('Fehler beim Laden der Termine:', error));
}

// Zählt die Termine in einem Zeitslot
function getAppointmentCount(appointments, slot) {
    return appointments.filter(function(appointment) { return appointment.time === slot; }).length;
}

// Aktualisiert die Farbe des Buttons basierend auf der Anzahl der Termine
function updateButtonColor(button, count) {
    button.classList.remove('green', 'orange', 'red');
    if (count === 1) {
        button.classList.add('green');
    } else if (count === 2) {
        button.classList.add('orange');
    } else if (count >= 3) {
        button.classList.add('red');
    }
}

// Lädt die Termine für einen ganzen Monat
function loadMonthAppointments(year, month) {
    const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-31`;
    return fetch(`http://localhost:3001/appointments/count?startDate=${startDate}&endDate=${endDate}`)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            console.log('Monatsdaten empfangen:', data);
            return data.reduce(function(accumulator, item) {
                accumulator[item.date] = item.count;
                return accumulator;
            }, {});
        });
}

// Bestimmt die Farbklasse basierend auf der Anzahl der Termine
function getColorClass(count) {
    if (count === 0) return 'original-color';
    if (count >= 1 && count <= 4) return 'green';
    if (count >= 5 && count <= 8) return 'orange';
    return 'red';
}

// Generiert den Kalender für einen bestimmten Monat und Jahr
function generateCalendar(month, year) {
    const calendarDays = document.querySelector('.calendar-days');
    calendarDays.innerHTML = '';

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevDays = new Date(year, month, 0).getDate();

    let table = document.createElement('table');
    let row = table.insertRow();
    let dayCounter = 1;
    let nextMonthDay = 1;
    let cell;

    for (let x = 0; x < firstDayIndex; x++) {
        cell = row.insertCell();
        cell.textContent = prevDays - firstDayIndex + x + 1;
        cell.classList.add('other-month');
    }

    while (dayCounter <= daysInMonth) {
        if (row.cells.length === 7) {
            row = table.insertRow();
        }
        cell = row.insertCell();
        cell.textContent = dayCounter;
        const currentDay = dayCounter;
        cell.addEventListener('click', function() { openAgendaModal(currentDay, month, year); });
        dayCounter++;
    }

    while (row.cells.length < 7) {
        cell = row.insertCell();
        cell.textContent = nextMonthDay;
        cell.classList.add('other-month');
        nextMonthDay++;
    }

    calendarDays.appendChild(table);

    // Lädt die Termine nach der Generierung des Kalenders
    loadMonthAppointments(year, month).then(function(appointmentCounts) {
        updateCalendarColors(appointmentCounts, year, month);
    }).catch(function(error) {
        console.error('Fehler beim Laden der Monats-Termine:', error);
    });
}

// Aktualisiert die Farben der Kalendertage
function updateCalendarColors(appointmentCounts, year, month) {
    console.log('Aktualisiere Kalenderfarben:', appointmentCounts);
    const cells = document.querySelectorAll('.calendar-days td:not(.other-month)');
    cells.forEach(function(cell, index) {
        const day = index + 1;
        const currentDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const count = appointmentCounts[currentDate] || 0;
        cell.classList.add(getColorClass(count));
    });
}

// Aktualisiert den Kalender
function updateCalendar() {
    try {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        generateCalendar(month, year);
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Kalenders:", error);
    }
}

// Öffnet das Modal für einen bestimmten Tag
function openAgendaModal(day, month, year) {
const formattedMonth = (month + 1).toString().padStart(2, '0');
selectedDate = `${year}-${formattedMonth}-${day.toString().padStart(2, '0')}`;
document.getElementById('selected-date').innerText = `Datum: ${selectedDate}`;

// Zurücksetzen des Zustands der Zeitslot-Buttons
const timeSlotButtons = document.querySelectorAll('.time-slot-button');
timeSlotButtons.forEach(function(button) {
button.classList.remove('green', 'orange', 'red', 'full');
button.textContent = button.textContent.replace(' (Voll)', '');
});

// Laden der vorhandenen Termine
loadAppointments(selectedDate);

document.getElementById('agenda-modal').classList.add('active');
document.querySelector('.backdrop').classList.add('active');
}

// Wählt einen Zeitslot aus
function selectTimeSlot(event) {
selectedTimeSlot = event.target.dataset.time;
const timeBlock = document.getElementById('selected-time-block');
const timeHeader = document.getElementById('selected-time-header');
const appointmentsList = timeBlock.querySelector('.appointments-list');

timeHeader.textContent = event.target.textContent;
appointmentsList.innerHTML = '';
timeBlock.style.display = 'block';

const appointmentInputArea = timeBlock.querySelector('.appointment-input-area');
appointmentInputArea.style.display = 'flex';

fetch(`http://localhost:3001/appointments?date=${selectedDate}&time=${selectedTimeSlot}`)
.then(function(response) { return response.json(); })
.then(function(data) {
    data.forEach(function(appointment) {
        const listItem = createAppointmentListItem(appointment);
        appointmentsList.appendChild(listItem);
    });

    const appointmentCount = appointmentsList.children.length;
    updateButtonColor(event.target, appointmentCount);

    if (appointmentCount >= 3) {
        appointmentInputArea.style.display = 'none';
        alert('Dieser Zeitslot ist voll. Maximal 3 Termine erreicht.');
    }
})
.catch(function(error) { console.error('Fehler:', error); });
}
// Erstellt ein Listenelement für einen Termin
function createAppointmentListItem(appointment) {
    const listItem = document.createElement('li');
    listItem.textContent = appointment.description;

    const editButton = document.createElement('button');
    editButton.textContent = 'Bearbeiten';
    editButton.classList.add('edit-appointment-button');
    editButton.addEventListener('click', function() { editAppointment(listItem, appointment); });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Löschen';
    deleteButton.classList.add('delete-appointment-button');
    deleteButton.addEventListener('click', function() { deleteAppointment(listItem, appointment.id); });

    listItem.appendChild(editButton);
    listItem.appendChild(deleteButton);

    return listItem;
}

// Fügt einen neuen Termin hinzu
function addAppointment() {
if (!selectedTimeSlot) {
alert('Bitte wählen Sie zuerst einen Zeitslot aus.');
return;
}

getTotalAppointmentsForDay(selectedDate).then(function(totalAppointments) {
if (totalAppointments >= 12) {
    alert('Maximale Anzahl von Terminen für diesen Tag erreicht (12).');
    return;
}

const timeBlock = document.getElementById('selected-time-block');
const appointmentsList = timeBlock.querySelector('.appointments-list');
const appointmentInput = timeBlock.querySelector('.appointment-input');
const appointmentText = appointmentInput.value.trim();

if (appointmentText) {
    if (appointmentsList.children.length < 3) {
        fetch('http://localhost:3001/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedDate,
                time: selectedTimeSlot,
                description: appointmentText
            })
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            const listItem = createAppointmentListItem(data);
            appointmentsList.appendChild(listItem);
            appointmentInput.value = '';

            const newTotalAppointments = totalAppointments + 1;
            updateDayColor(selectedDate, newTotalAppointments);

            if (appointmentsList.children.length >= 3) {
                timeBlock.querySelector('.appointment-input-area').style.display = 'none';
                alert('Zeitslot voll. Maximal 3 Termine erreicht.');
            }

            // Aktualisieren des Zustands des Zeitslot-Buttons
            const button = document.querySelector(`.time-slot-button[data-time="${selectedTimeSlot}"]`);
            updateButtonColor(button, appointmentsList.children.length);
        })
        .catch(function(error) { console.error('Fehler:', error); });
    } else {
        alert('Sie können maximal 3 Termine in diesem Zeitfenster hinzufügen.');
    }
} else {
    alert('Bitte geben Sie einen Termin ein.');
}
});
}
// Bearbeitet einen bestehenden Termin
function editAppointment(listItem, appointment) {
    const newText = prompt('Termin bearbeiten:', appointment.description);
    if (newText && newText !== appointment.description) {
        fetch(`http://localhost:3001/appointments/${appointment.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: newText
            })
        })
        .then(function(response) { return response.json(); })
        .then(function(updatedAppointment) {
            listItem.textContent = updatedAppointment.description;
            const editButton = document.createElement('button');
            editButton.textContent = 'Bearbeiten';
            editButton.classList.add('edit-appointment-button');
            editButton.addEventListener('click', function() { editAppointment(listItem, updatedAppointment); });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Löschen';
            deleteButton.classList.add('delete-appointment-button');
            deleteButton.addEventListener('click', function() { deleteAppointment(listItem, updatedAppointment.id); });

            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);
        })
        .catch(function(error) { console.error('Fehler beim Bearbeiten des Termins:', error); });
    }
}

// Löscht einen Termin
function deleteAppointment(listItem, appointmentId) {
    fetch(`http://localhost:3001/appointments/${appointmentId}`, {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            const appointmentsList = listItem.parentElement;
            appointmentsList.removeChild(listItem);

            const appointmentInputArea = document.querySelector('#selected-time-block .appointment-input-area');
            if (appointmentsList.children.length < 3) {
                appointmentInputArea.style.display = 'flex';
            }

            // Aktualisieren des Zustands des Zeitslot-Buttons
            const button = document.querySelector(`.time-slot-button[data-time="${selectedTimeSlot}"]`);
            if (appointmentsList.children.length < 3) {
                button.classList.remove('full');
                button.textContent = button.textContent.replace(' (Voll)', '');
            }
        } else {
            console.error('Fehler beim Löschen des Termins:', response.status);
        }
    })
    .catch(function(error) { console.error('Fehler:', error); });
}

// Speichert die Termine
function saveAppointment() {
    alert('Termine gespeichert!');
    closeAgendaModal();
}

// Schließt das Modal
function closeAgendaModal() {
    document.getElementById('agenda-modal').classList.remove('active');
    document.querySelector('.backdrop').classList.remove('active');
}

// Event-Listener für das Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    const timeSlotButtons = document.querySelectorAll('.time-slot-button');
    timeSlotButtons.forEach(function(button) {
        button.addEventListener('click', selectTimeSlot);
    });

    const addAppointmentButton = document.querySelector('.add-appointment-button');
    addAppointmentButton.addEventListener('click', addAppointment);

    // Initialisiert den Kalender
    updateCalendar();

    // Fügt Event-Listener für die Monats- und Jahresauswahl hinzu
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    monthSelect.addEventListener('change', updateCalendar);
    yearSelect.addEventListener('change', updateCalendar);
});