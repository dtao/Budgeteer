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

    var expenseRow = document.createElement('TR');
    expenseRow.setAttribute('data-expense-id', expense.id);
    expenseRow.setAttribute('data-timestamp', expense.timestamp);

    var dateCell = document.createElement('TD');
    expenseRow.appendChild(dateCell);
    dateCell.textContent = new Date(expense.timestamp).toLocaleString();

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
        fontFamily: 'Helvetica',
        fontSize: 30,
        fontWeight: 300
      },
      axisX: {
        labelFontFamily: 'Helvetica',
        valueFormatString: "MMM D"
      },
      axisY: {
        labelFontFamily: 'Helvetica',
        valueFormatString: '$#,##0.##'
      },
      legend: {
        fontFamily: 'Helvetica',
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
      for (var i = 0; i < expenses.length; ++i) {
        addExpenseToUI(expenses[i], false);
      }

      refreshUI();
    });
  }

  function getTargetSpendingData() {
    var currentDate = new Date(),
        daysInMonth = getDaysInMonth();

    var budget = 3000; // Let's say
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
        var spending = spendingByDay[i] || 0;

        totalSpending += spending;

        var dataPoint = {
          x: new Date(currentDate.getFullYear(), currentDate.getMonth(), date),
          y: totalSpending,
          z: spending,
          markerType: spending > 0 ? 'circle' : 'none'
        };

        if (totalSpending > targetSpendingData[date - 1].y) {
          dataPoint.color = '#f00';
          dataPoint.markerColor = '#f00';
        }

        actualSpendingData.push(dataPoint);
      }(i));
    }

    return actualSpendingData;
  }

  function getDaysInMonth() {
    var date  = new Date(),
        month = MONTHS[date.getMonth()];

    return typeof month.days === 'number' ? month.days : month.days(date.getFullYear());
  }

  window.addEventListener('load', function() {
    var expensesForm     = document.getElementById('expenses-form'),
        descriptionField = expensesForm.querySelector('input[name="description"]');

    expensesForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var match = (/^\s*\$?(\d+(?:\.\d*)?)\s+(?:for|at|on)\s+(.*)$/).exec(descriptionField.value);
      if (!match) {
        return;
      }

      var amount      = Number(match[1]);
      var description = match[2];
      var timestamp   = new Date().getTime();

      addExpense({ amount: amount, description: description, timestamp: timestamp });
      expensesForm.reset();
    });

    fetchExpenses();
  });

}(window, document));