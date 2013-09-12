(function(window, document) {

  var MONTHS = [
    { name: 'January', days: 31 },
    { name: 'February', days: function(year) { return year % 4 === 0 ? 29 : 28 } },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 }
  ];

  // TODO: Make this configurable!
  var BUDGET = 5000;

  function makeRequest(method, action, data, callback) {
    var request = new XMLHttpRequest();
    request.open(method, action);
    request.setRequestHeader('Content-Type', 'application/json');

    request.addEventListener('load', function() {
      var response = JSON.parse(request.responseText);
      callback(response);
      endRequest();
    });

    beginRequest();
    request.send(data ? JSON.stringify(data) : undefined);
  }

  function beginRequest() {
    document.body.classList.add('loading');
  }

  function endRequest() {
    document.body.classList.remove('loading');
  }

  function addExpense(expense) {
    makeRequest('POST', '/expenses', expense, addExpenseToUI);
  }

  function addExpenseToUI(expense, refresh) {
    if (typeof refresh === 'undefined') {
      refresh = true;
    }

    var expenseDate = new Date(expense.timestamp);

    var expenseRow = document.createElement('TR');
    expenseRow.setAttribute('data-expense-id', expense.id);
    expenseRow.setAttribute('data-timestamp', expense.timestamp);

    var dateCell = document.createElement('TD');
    expenseRow.appendChild(dateCell);
    dateCell.textContent = formatDate(expenseDate);

    var timeCell = document.createElement('TD');
    expenseRow.appendChild(timeCell);
    timeCell.textContent = formatTime(expenseDate);

    var descriptionCell = document.createElement('TD');
    expenseRow.appendChild(descriptionCell);
    descriptionCell.textContent = expense.description;

    var amountCell = document.createElement('TD');
    expenseRow.appendChild(amountCell);
    amountCell.textContent = expense.amount.toFixed(2);

    var expensesTable = document.querySelector('#expenses-table > tbody');
    expensesTable.insertBefore(expenseRow, expensesTable.firstChild);

    if (refresh) {
      refreshUI();
    }
  }

  function refreshUI() {
    recomputeTotals();
    renderChart();
  }

  function recomputeTotals() {
    var expensesTable = document.querySelector('#expenses-table > tbody');
    var expensesRows = expensesTable.querySelectorAll('tr');

    var total = 0.0;
    for (var i = 0; i < expensesRows.length; ++i) {
      total += Number(expensesRows[i].querySelector('td:last-child').textContent);
    }

    var totalsRow = document.querySelector('#expenses-table > tfoot tr');
    var totalCell = totalsRow.querySelector('td:last-child');
    totalCell.textContent = total.toFixed(2);
  }

  function renderChart() {
    var targetSpendingData = getTargetSpendingData(),
        actualSpendingData = getActualSpendingData(targetSpendingData);

    var chart = new CanvasJS.Chart('expenses-chart', {
      title: {
        text: 'Expenses for ' + MONTHS[new Date().getMonth()].name,
        fontFamily: 'Actor',
        fontSize: 30,
        fontWeight: 300
      },
      axisX: {
        labelFontFamily: 'Actor',
        valueFontFamily: 'Actor',
        valueFormatString: "MMM D"
      },
      axisY: {
        labelFontFamily: 'Actor',
        valueFormatString: '$#,##0.##'
      },
      legend: {
        fontFamily: 'Actor',
      },
      data: [
        {        
          type: 'line',
          showInLegend: true,
          lineThickness: 1,
          name: 'Target Spending',
          markerType: 'none',
          color: '#000',
          dataPoints: targetSpendingData
        },
        {        
          type: 'bubble',
          showInLegend: false,
          name: 'Actual Spending',
          color: '#0b4',
          dataPoints: actualSpendingData
        }
      ]
    });

    chart.render();

    // Screw you, CanvasJS!
    var linkToCanvasJS = document.querySelector('#expenses-chart a[href*="canvasjs.com"]');
    linkToCanvasJS.parentNode.removeChild(linkToCanvasJS);
  }

  function fetchExpenses() {
    makeRequest('GET', '/expenses', null, function(expenses) {
      expenses.sort(function(x, y) {
        return x.timestamp - y.timestamp;
      });

      for (var i = 0; i < expenses.length; ++i) {
        addExpenseToUI(expenses[i], false);
      }

      refreshUI();
    });
  }

  function getTargetSpendingData() {
    var currentDate = new Date(),
        daysInMonth = getDaysInMonth();

    var budget = BUDGET;
    var targetDailySpending = budget / daysInMonth;

    var targetSpendingData = [];
    for (var i = 1; i <= daysInMonth; ++i) {
      targetSpendingData.push({
        x: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        y: targetDailySpending * i
      });
    }

    return targetSpendingData;
  }

  function getActualSpendingData(targetSpendingData) {
    var expensesTable = document.querySelector('#expenses-table > tbody'),
        expensesRows  = expensesTable.querySelectorAll('tr');

    var spendingByDay = {};
    for (var i = 0; i < expensesRows.length; ++i) {
      (function(expenseRow) {
        var timestamp = Number(expenseRow.getAttribute('data-timestamp')),
            date      = new Date(timestamp),
            key       = date.getDate(),
            value     = Number(expenseRow.querySelector('td:last-child').textContent);

        spendingByDay[key] = spendingByDay[key] || 0;
        spendingByDay[key] += value;

      }(expensesRows[i]));
    }

    var currentDate        = new Date(),
        daysInMonth        = getDaysInMonth(),
        actualSpendingData = [],
        totalSpending      = 0.0;

    for (var i = 1; i <= daysInMonth; ++i) {
      (function(date) {
        var spending = spendingByDay[i] || 0,
            targetSpending = targetSpendingData[date - 1].y;

        totalSpending += spending;

        var dataPoint = {
          x: new Date(currentDate.getFullYear(), currentDate.getMonth(), date),
          y: totalSpending,
          z: spending,
          markerType: spending > 0 ? 'circle' : 'none'
        };

        if (totalSpending > targetSpending) {
          dataPoint.color = '#f00';
          dataPoint.markerColor = '#f00';
        }

        actualSpendingData.push(dataPoint);

        if (date === currentDate.getDate()) {
          setSpendingToday(spending, targetSpending);
        }

      }(i));
    }

    return actualSpendingData;
  }

  function setSpendingToday(spending, targetSpending) {
    var budget  = targetSpending,
        percent = ((budget - spending) / budget) * 100,
        bar     = document.querySelector('#spending-bar .remaining'),
        label   = bar.querySelector('span');

    label.textContent = '$' + (budget - spending).toFixed(2);
    bar.style.height = bound(percent, 0, 100) + '%';
  }

  function getDaysInMonth() {
    var date  = new Date(),
        month = MONTHS[date.getMonth()];

    return typeof month.days === 'number' ? month.days : month.days(date.getFullYear());
  }

  function formatDateTime(date, time) {
    return formatDate(date) + ' ' + formatTime(time || date);
  }

  function formatDate(date) {
    return [
      date.getMonth() + 1,
      date.getDate(),
      date.getFullYear()
    ].join('/');
  }

  function formatTime(time) {
    var hourPart = time.getHours() % 12;
    if (hourPart === 0) {
      hourPart = 12;
    }

    var timePart = [
      hourPart !== 0 ? hourPart : 12,
      padTime(time.getMinutes()),
      padTime(time.getSeconds())
    ].join(':');

    return timePart + ' ' + (hourPart < 12 ? 'AM' : 'PM');
  }

  function padTime(time) {
    return time >= 10 ? time : '0' + time;
  }

  function bound(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  function parseDate(dateString) {
    var datePart = dateString.split('/');
    var timePart = new Date();

    return new Date(
      datePart[2],
      datePart[0] - 1,
      datePart[1],
      timePart.getHours(),
      timePart.getMinutes(),
      timePart.getSeconds()
    );
  }

  window.addEventListener('load', function() {
    var expensesForm     = document.getElementById('expenses-form'),
        descriptionField = expensesForm.querySelector('input[name="description"]'),
        dateField        = expensesForm.querySelector('input[name="date"]');

    expensesForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var match = (/^\s*\$?(\d+(?:\.\d*)?)\s+(?:for|at|on)\s+(.*)$/).exec(descriptionField.value);
      if (!match) {
        return;
      }

      var amount      = Number(match[1]);
      var description = match[2];
      var timestamp   = parseDate(dateField.value).getTime();

      addExpense({
        amount: amount,
        description: description,
        timestamp: timestamp
      });

      descriptionField.value = '';
    });

    fetchExpenses();

    var datePicker = new Kalendae.Input(dateField, {
      format: 'MM/DD/YYYY',
      selected: formatDate(new Date())
    });
  });

}(window, document));
