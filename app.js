const model = (() => {
  const stampDutyInfo = [
    {
      fullCalculation: [
        {
          name: "single property",
          percentRange: [
            {
              "less than £125k": 0
            },
            {
              "£125k to £250k": 2
            },
            {
              "£250k to £925k": 5
            },
            {
              "£925k to £1.5m": 10
            },
            {
              "rest over £1.5m": 12
            }
          ],
          range: [125000, 250000, 925000, 1500000]
        },
        {
          name: "addional property",
          percentRange: [
            {
              "less than £125k": 3
            },
            {
              "£125k to £250k": 5
            },
            {
              "£250k to £925k": 8
            },
            {
              "£925k to £1.5m": 13
            },
            {
              "rest over £1.5m": 15
            }
          ],
          range: [125000, 250000, 925000, 1500000]
        },
        {
          name: "first time buyer",
          percentRange: [
            {
              "less than £300k": 0
            },
            {
              "£300k to £500k": 5
            },
            {
              "£500k to £925k": 5
            },
            {
              "£925k to £1.5m": 10
            },
            {
              "rest over £1.5m": 12
            }
          ],
          range: [300000, 500000, 925000, 1500000]
        }
      ],
      currentAmount: null,
      current: null,
      tableTitles: ["Tax Band", "%", "Taxable Sum", "Tax"]
    }
  ];

  const data = stampDutyInfo[0];

  return {
    setCurrent: current => {
      data.current = current;
    },
    getCurrent: () => {
      return data.current;
    },
    setAmount: amount => {
      data.currentAmount = amount;
    },
    getAmount: () => {
      return data.currentAmount;
    },
    getData: () => {
      return data.fullCalculation;
    },
    getTables: () => {
      return data.tableTitles;
    }
  };
})();

const view = (() => {
  const formatMoney = new Intl.NumberFormat("en-UK", {
    style: "currency",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currency: "GBP"
  });

  let DOMStrings;

  DOMStrings = {
    active: "sd--active",
    btns: "sd__btns",
    btn: "sd__btn",
    btnType: "sd__btn__type",
    results: "sd__results",
    resultsContainer: "sd__results__container",
    close: "sd__close",
    closeInside: "sd__close-inside",
    calculation: "sd__calculation",
    calculationInner: "sd__calculation__inner",
    title: "sd__title",
    sd: "sd",
    SD__POPUP__PRESENT: "sd__popup__present",
    icon: "sd__icon",
    inner: "sd__inner",
    row: "sd__row",
    greyLight: "sd__grey-light",
    flexOne: "sd__flex-one",
    smFont: "sd__sm-font",
    amount: "sd__amount",
    bold: "sd__bold"
  };
  const createButtons = data => {
    let buttons = ``;
    for (let i = 0; i < data.length; i++) {
      buttons += `
      <button class="${DOMStrings.btn} ${DOMStrings.btnType}" data-name='${i +
        1}'>${data[i].name}</button>
      `;
    }
    return buttons;
  };

  return {
    getCurrentDataKey: (name, i) => {
      return Object.keys(name[i]);
    },
    getCurrentDataValue: (name, i) => {
      return name[i][Object.keys(name[i])];
    },
    amountInRange: (amount, a, b, percent) => {
      let amountToTax;

      if (amount > a && amount <= b) {
        amountToTax = amount - a;
      } else {
        if (percent === 0) {
          amountToTax = 0;
        } else if (amount < a) {
          amountToTax = 0;
        } else {
          amountToTax = a;
        }
      }

      return amountToTax;
    },
    totalTaxAmount: (amount, percent) => {
      return (amount / 100) * percent;
    },
    displaySD: (data, amount) => {
      let sd_icon = chrome.extension.getURL("./images/percentage.svg");
      let SDhtml = `
      <div class="${DOMStrings.sd} ${DOMStrings.active}" >
      <img src="${sd_icon}" width="25px;" class="${
        DOMStrings.icon
      }" style="display:block">
      <div class="${DOMStrings.inner}">
        <div class="${DOMStrings.close}"><span class="${
        DOMStrings.closeInside
      }">&times;</span></div>
        <p class="${DOMStrings.title}">Stamp duty calculator</p>
        <p class="${DOMStrings.amount}">${formatMoney.format(amount)}</p>
        <div class ="${DOMStrings.btns}">
          ${createButtons(data)}
        </div>
      <div class="${DOMStrings.results} ${DOMStrings.btnType}"></div>
    </div>`;
      return SDhtml;
    },

    currentDataType(data, current, name) {
      return data[current - 1][name];
    },
    calcPercent(a, b) {
      return (a / 100) * b;
    },
    calcPreviousPercentTotal(selectedData, percentRange, currentDataRange) {
      // previous percent calc to pay
      // pass the previous range of percent
      const previousPercent =
        percentRange[selectedData][Object.keys(percentRange[selectedData])];
      // work out the range to calc percent on
      const previousAmountToTax =
        currentDataRange[selectedData] - currentDataRange[0];
      // work out value
      const previousPerCentCalc = this.calcPercent(
        previousAmountToTax,
        previousPercent
      );
      return previousPerCentCalc;
    },
    currentPercentPayment(amount, currentDataRange, selectedRange, percent) {
      // get the current range percent calc
      const amountToTax = amount - currentDataRange[selectedRange];
      const perCentCalc = this.calcPercent(amountToTax, percent);
      return perCentCalc;
    },
    totalCosts(currentDataRange, amount, percentRange) {
      let currentPercentTotal = 0;
      let percent;
      for (let i = 0; i < currentDataRange.length; i++) {
        if (amount > currentDataRange[i] && amount <= currentDataRange[i + 1]) {
          percent = percentRange[i + 1][Object.keys(percentRange[i + 1])];
          // previous percent calc to pay
          currentPercentTotal += this.calcPreviousPercentTotal(
            i,
            percentRange,
            currentDataRange
          );

          currentPercentTotal += this.currentPercentPayment(
            amount,
            currentDataRange,
            i,
            percent
          );
        } else if (amount <= currentDataRange[0]) {
          percent = percentRange[0][Object.keys(percentRange[0])];
          currentPercentTotal += calcPercent(amount, percent);
        }
      }
      return {
        currentPercentTotal,
        percent
      };
    },
    createTableRows(data, percentRange, currentDataRange, amount) {
      // create the rows for each range
      let tableRows = ``;

      for (let i = 0; i < data[0].percentRange.length; i++) {
        let amountInRange;
        let totalTaxtAmount;

        if (i === 0) {
          amountInRange = formatMoney.format(
            this.amountInRange(
              amount,
              currentDataRange[0],
              currentDataRange[0],
              this.getCurrentDataValue(percentRange, 0)
            )
          );
          totalTaxtAmount = formatMoney.format(
            this.totalTaxAmount(
              this.amountInRange(
                amount,
                currentDataRange[0],
                currentDataRange[0],
                this.getCurrentDataValue(percentRange, 0)
              ),
              this.getCurrentDataValue(percentRange, 0)
            )
          );
        } else {
          amountInRange = formatMoney.format(
            this.amountInRange(
              amount,
              currentDataRange[i - 1],
              currentDataRange[i],
              this.getCurrentDataValue(percentRange, i)
            )
          );

          totalTaxtAmount = formatMoney.format(
            this.totalTaxAmount(
              this.amountInRange(
                amount,
                currentDataRange[i - 1],
                currentDataRange[i],
                this.getCurrentDataValue(percentRange, i)
              ),
              this.getCurrentDataValue(percentRange, i)
            )
          );
        }
        tableRows += `
          <div class='${DOMStrings.row} ${DOMStrings.greyLight}'>
          <div class="${DOMStrings.flexOne}">
            ${this.getCurrentDataKey(percentRange, i)}
          </div>
          <div class="${DOMStrings.flexOne}">
          ${this.getCurrentDataValue(percentRange, i)}
          </div>
          <div class="${DOMStrings.flexOne}">
          ${amountInRange}
          </div>
          <div class="${DOMStrings.flexOne}">
          ${totalTaxtAmount}
          </div>
          </div>
          `;
      }

      return tableRows;
    },
    createStampDutyInfo(data, current, percent, amount, currentPercentTotal) {
      //  Create section once property type button is clicked
      let currentDisplay = `
      <div class="${DOMStrings.resultsContainer}">
        <p>Type: ${data[current - 1].name}</p>
        <p>Amount: ${formatMoney.format(amount)}</p>
        <p>Percent:<span class="${
          DOMStrings.smFont
        }">(highest)</span> ${percent}%</p>
        <p>Stamp duty cost: <span class="${
          DOMStrings.bold
        }">${formatMoney.format(currentPercentTotal)}</span></p>
      </div>

      <button class="${DOMStrings.calculation} ${
        DOMStrings.btn
      }" data-calculation="view">View calculation</button>
    `;
      return currentDisplay;
    },
    createTableTitles(tableTitles) {
      // get table titles from data
      let tableTitleNames = ``;
      for (let i = 0; i < tableTitles.length; i++) {
        tableTitleNames += `
      <div class="${DOMStrings.flexOne}">${tableTitles[i]}</div>
      `;
      }
      return tableTitleNames;
    },
    createTable(tableTitleNames, tableRows) {
      // add above functions to create the table
      let table = `
      <div class="${DOMStrings.calculationInner} ${DOMStrings.smFont}">
        <div class="${DOMStrings.row} ${DOMStrings.grey}">
        ${tableTitleNames}
      </div>
      ${tableRows}
    </div>
    </div>
    </div>`;
      return table;
    },

    updateDisplay(data, current, amount, tableTitles) {
      const currentDataRange = this.currentDataType(data, current, "range");
      const percentRange = this.currentDataType(data, current, "percentRange");
      let totalCostFnc = this.totalCosts(
        currentDataRange,
        amount,
        percentRange
      );
      // return from inside totalCostFnc
      let percent = totalCostFnc.percent;
      let currentPercentTotal = totalCostFnc.currentPercentTotal;

      let tableRows = this.createTableRows(
        data,
        percentRange,
        currentDataRange,
        amount
      );

      let currentDisplay = this.createStampDutyInfo(
        data,
        current,
        percent,
        amount,
        currentPercentTotal
      );

      let tableTitleNames = this.createTableTitles(tableTitles);
      let table = this.createTable(tableTitleNames, tableRows);
      // Add the table to the bottom of stamp duty info
      currentDisplay += table;

      document.querySelector(
        `.${DOMStrings.results}`
      ).innerHTML = currentDisplay;
    },

    getDOMStrings: () => {
      return DOMStrings;
    }
  };
})();

const controller = ((m, v) => {
  let setUpEvents = () => {
    let data = m.getData();
    let DOM = v.getDOMStrings();

    // check if sd__active is there
    document.addEventListener("dblclick", function(e) {
      if (!document.body.classList.contains(`${DOM.SD__POPUP__PRESENT}`)) {
        // get string
        const target = e.target.innerHTML;
        // remove all apart from numbers
        let formattedTarget = target.replace(/[^0-9]/g, "");
        const endNumber = parseFloat(formattedTarget);

        if (Number.isInteger(endNumber)) {
          const amount = endNumber;
          m.setAmount(amount);
          // create pop up html stamp duty
          e.target.insertAdjacentHTML("beforeEnd", v.displaySD(data, amount));
          document.body.classList.add(`${DOM.SD__POPUP__PRESENT}`);
        }
      }
    }); // end dbl click

    document.addEventListener(
      "click",
      function(event) {
        // click property type calculation
        if (containsClass(DOM.btnType)) {
          propertyTypeClick(event);
        }
        // togglePopUp
        togglePopUp(event);
        // toggle calc inner
        if (event.target.dataset.calculation === "view") {
          toggleDisplay(DOM.calculationInner);
        }

        if (containsClass(DOM.icon)) {
          // toggle inside container with app in
          toggleDisplay(DOM.inner);
          // toggle inital sd_icon popup
          toggleDisplay(DOM.icon);
          // toggle height
        }
      },
      false
    );
  };

  let DOM = v.getDOMStrings();
  let data = m.getData();

  const containsClass = className => {
    return event.target.classList.contains(className);
  };

  const propertyTypeClick = event => {
    // get the data 1,2,3 from btns
    const current = event.target.dataset.name;
    // set current
    m.setCurrent(current);
    m.getCurrent();
    // get new amount
    const currentAmount = getCurrentAmount();
    const tableTitles = m.getTables();
    // display results of stamp duty
    v.updateDisplay(data, current, currentAmount, tableTitles);
  };

  const togglePopUp = event => {
    const popup = document.querySelector(`.${DOM.active}`);
    let targetElement = event.target; // clicked element
    // search up the dom, if active class is present inside of
    // the popup on click do nothing
    // else clicking outside remove the div
    if (
      targetElement.classList.contains(`${DOM.close}`) ||
      targetElement.classList.contains(`${DOM.closeInside}`)
    ) {
      removeElements(document.querySelectorAll(`.${DOM.active}`));
      document.body.classList.remove(`${DOM.SD__POPUP__PRESENT}`);
    } else {
      do {
        if (targetElement == popup) {
          // This is a click inside. Do nothing, just return.
          return;
        }
        // Go up the DOM
        targetElement = targetElement.parentNode;
      } while (targetElement);

      // This is a click outside.
      // remove popup
      // reset current data
      document.body.classList.remove(`${DOM.SD__POPUP__PRESENT}`);
      removeElements(document.querySelectorAll(`.${DOM.active}`));
    }
  };

  const toggleDisplay = className => {
    const targetClass = document.querySelector(`.${className}`);
    let currentDisplay = targetClass.style.display;

    if (currentDisplay === "block") {
      document.querySelector(`.${className}`).style.display = "none";
    } else {
      document.querySelector(`.${className}`).style.display = "block";
    }
  };

  const getCurrentAmount = () => {
    return m.getAmount();
  };

  const removeElements = elms => elms.forEach(el => el.remove());

  return {
    init: () => {
      setUpEvents();
      console.log("stamp duty extension started");
    }
  };
})(model, view);
controller.init();
