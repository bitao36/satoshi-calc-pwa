document.addEventListener("DOMContentLoaded", async function () {
  const tabButtons = document.querySelectorAll(".tab-button");

  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(button => { // Existing tab switching logic
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;

      tabButtons.forEach(btn => {
        btn.classList.remove("active");
      });
      button.classList.add("active");

      tabPanes.forEach(pane => {
        if (pane.id === tab) {
          pane.classList.add("active");
        } else {
          pane.classList.remove("active");
        }
      });
    });
  });

  const btnConvertir = document.getElementById("btnConvertir");
  // References to info panel labels
  const labelfiatUSD = document.getElementById("fiatUSD");
  const usdToDefaultCurrency = document.getElementById("usdToDefaultCurrency"); // Nuevo label
  const labelResultado = document.getElementById("resultado");
  const labelResultadoUSD = document.getElementById("resultadoUSD");
  const labelResultadoDivisa = document.getElementById("resultadoDivisa");
  const amountInput = document.getElementById("amount");
  const currencySelector = document.getElementById("currencySelector");
  const unidadSelector = document.getElementById("unidadSelector");

  // New element for default currency setting
  const defaultCurrencySelector = document.getElementById("defaultCurrencySelector");

  const btnConvertirFiat = document.getElementById("btnConvertirFiat");
  const fiatAmountInput = document.getElementById("fiatAmount");
  const fiatCurrencySelector = document.getElementById("fiatCurrencySelector");
  const cryptoUnitSelector = document.getElementById("cryptoUnitSelector");
  const fiatToCryptoResult = document.getElementById("fiatToCryptoResult");

  // New elements for footer icons and modals
  const infoIconBtn = document.getElementById("infoIconBtn");
  const settingsIconBtn = document.getElementById("settingsIconBtn");
  const learningIconBtn = document.getElementById("learningIconBtn");
  const infoModal = document.getElementById("infoModal");
  const settingsModal = document.getElementById("settingsModal");
  const learningModal = document.getElementById("learningModal");
  // Get close buttons for modals
  const infoCloseBtn = infoModal.querySelector(".close-button");
  const settingsCloseBtn = settingsModal.querySelector(".close-button");
  const learningCloseBtn = learningModal.querySelector(".close-button");

  // New elements for numeric keypad
  const numericKeypadCrypto = document.getElementById("numericKeypadCrypto");
  const numericKeypadFiat = document.getElementById("numericKeypadFiat");
  const keypadToggleBtnCrypto = document.getElementById("keypadToggleBtnCrypto");
  const keypadToggleBtnFiat = document.getElementById("keypadToggleBtnFiat");

  let activeInputField = null; // To keep track of which input is currently active





  function formatNumber(number) {
    const options = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    };
    return new Intl.NumberFormat('de-DE', options).format(number);
  }

  // Populate defaultCurrencySelector with options from currencySelector
  // This ensures consistency and avoids duplicating the list
  const currencyOptions = Array.from(currencySelector.options);
  currencyOptions.forEach(option => {
    const newOption = document.createElement('option');
    newOption.value = option.value;
    newOption.textContent = option.textContent;
    defaultCurrencySelector.appendChild(newOption);
  });

  // Load saved default currency from localStorage or use 'COP' as initial default
  let currentDefaultCurrency = localStorage.getItem('defaultUSDConversionCurrency') || 'COP';
  defaultCurrencySelector.value = currentDefaultCurrency;
  currencySelector.value = currentDefaultCurrency;

  // Variable to cache API response
  let cachedExchangeRates = null;

  // Function to fetch exchange rates and update info panel labels
  async function fetchAndDisplayExchangeRates(defaultCurrency) {
    try {
      // Llamada a la API
      console.log("Fetching exchange rates...");
      
    const response = await fetch("https://api.yadio.io/exrates/USD");
    
    if (!response.ok) {
      throw new Error("Error al obtener los datos de la API");
    }
    const data = await response.json();
    cachedExchangeRates = data; // Cache the fetched data
    localStorage.setItem('cachedExchangeRates', JSON.stringify(data)); // Store in localStorage

    const btcValue = data.BTC;
    labelfiatUSD.innerHTML = `1 BTC equivale a <span class="fiat-value">${formatNumber(btcValue)}</span> USD`;

    // Actualizar el label de USD a la divisa por defecto
    const usdToDefaultCurrencyValue = data.USD[defaultCurrency];
    if (usdToDefaultCurrencyValue) {
      usdToDefaultCurrency.innerHTML = `1 USD equivale a <span class="fiat-value">${formatNumber(usdToDefaultCurrencyValue)}</span> ${defaultCurrency}`;
    } else {
      usdToDefaultCurrency.textContent = `Error al obtener 1 USD a ${defaultCurrency}`;
    }
    return data; // Return data for immediate use if needed
    } catch (error) {
      console.error("Hubo un error:", error);
      console.log("Attempting to load from localStorage...");
      const storedRates = localStorage.getItem('cachedExchangeRates');
      if (storedRates) {
        console.log("Found stored rates in localStorage.");
        const data = JSON.parse(storedRates);
        cachedExchangeRates = data;

        const btcValue = data.BTC;
        labelfiatUSD.innerHTML = `1 BTC equivale a <span class="fiat-value">${formatNumber(btcValue)}</span> USD (offline)`;

        const usdToDefaultCurrencyValue = data.USD[defaultCurrency];
        if (usdToDefaultCurrencyValue) {
          usdToDefaultCurrency.innerHTML = `1 USD equivale a <span class="fiat-value">${formatNumber(usdToDefaultCurrencyValue)}</span> ${defaultCurrency} (offline)`;
        } else {
          usdToDefaultCurrency.textContent = `Error al obtener 1 USD a ${defaultCurrency}`;
        }
        return data;
      } else {
        console.log("No stored rates found in localStorage.");
        labelfiatUSD.textContent = "Error al obtener la conversión.";
        usdToDefaultCurrency.textContent = "Error al obtener la conversión.";
        cachedExchangeRates = null; // Clear cache on error
        return null;
      }
    }
  }


  function calculateFiatValue(cantidad,unidad,btcToUSD) {
    
    const satsToBTC = 0.00000001;
    let fiat;

    if (unidad=="BTC") {
      fiat = cantidad * btcToUSD;
    } 
    else  
    {
      fiat = cantidad * satsToBTC * btcToUSD;
    } 

    return fiat;
  }

  function calculateCryptoValue(cantidad, divisa, btcToUSD, divisaValue) {
    let cryptoAmount;
    if (divisa === 'USD') {
      cryptoAmount = cantidad / btcToUSD;
    } else {
      cryptoAmount = (cantidad / divisaValue) / btcToUSD;
    }
    return cryptoAmount;
  }

  // Initial fetch and display of exchange rates
  await fetchAndDisplayExchangeRates(currentDefaultCurrency);

  // Update exchange rates every minute
  setInterval(() => {
    fetchAndDisplayExchangeRates(currentDefaultCurrency);
  }, 60000);

  // Event listener for default currency selector change
  defaultCurrencySelector.addEventListener('change', async () => {
    currentDefaultCurrency = defaultCurrencySelector.value;
    currencySelector.value = currentDefaultCurrency;
    localStorage.setItem('defaultUSDConversionCurrency', currentDefaultCurrency); // Save preference
    await fetchAndDisplayExchangeRates(currentDefaultCurrency); // Update display
  });

  // Function to create keypad buttons
  function createKeypadButtons(keypadElement, targetInput) {
    // Reordered keys for a standard 4x4 keypad layout
    const keys = [
      '7', '8', '9', 'C',
      '4', '5', '6', '⌫',
      '1', '2', '3', '.',
      '0', '00', '', '' // Using '00' and placeholders for layout
    ];

    keys.forEach(key => {
      const button = document.createElement('button');
      button.textContent = key;
      button.dataset.key = key;
      keypadElement.appendChild(button);

      // Make placeholder buttons invisible and non-interactive
      if (key === '') {
        button.style.visibility = 'hidden';
        button.disabled = true;
      }
    });

    keypadElement.addEventListener('click', (event) => {
      const clickedButton = event.target.closest('button');
      if (!clickedButton) return;

      const key = clickedButton.dataset.key;
      if (!activeInputField) return; // Ensure an input field is active

      let currentValue = activeInputField.value;

      switch (key) {
        case 'C':
          activeInputField.value = '';
          break;
        case '⌫':
          activeInputField.value = currentValue.slice(0, -1);
          break;
        case '.':
          if (!currentValue.includes('.')) {
            activeInputField.value += key;
          }
          break;
        case '': // Ignore clicks on placeholder buttons
          break;
        default: // Numbers
          activeInputField.value += key;
          break;
      }
    });
  }

  // Initialize keypads
  createKeypadButtons(numericKeypadCrypto, amountInput);
  createKeypadButtons(numericKeypadFiat, fiatAmountInput);

  // Event listeners for input fields to set activeInputField
  amountInput.addEventListener('focus', () => {
    activeInputField = amountInput;
    // Hide other keypad if visible
    // numericKeypadFiat.classList.add('hidden');
  });

  fiatAmountInput.addEventListener('focus', () => {
    activeInputField = fiatAmountInput;
    // Hide other keypad if visible
    // numericKeypadCrypto.classList.add('hidden');
  });

  // Event listeners for keypad toggle buttons
  keypadToggleBtnCrypto.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent document click from closing immediately
    numericKeypadCrypto.classList.toggle('hidden');
    numericKeypadFiat.classList.add('hidden'); // Ensure only one keypad is visible
    if (!numericKeypadCrypto.classList.contains('hidden')) {
      amountInput.focus(); // Set focus to the associated input
    } else {
      activeInputField = null; // Clear active input if keypad is hidden
    }
  });

  keypadToggleBtnFiat.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent document click from closing immediately
    numericKeypadFiat.classList.toggle('hidden');
    numericKeypadCrypto.classList.add('hidden'); // Ensure only one keypad is visible
    if (!numericKeypadFiat.classList.contains('hidden')) {
      fiatAmountInput.focus(); // Set focus to the associated input
    } else {
      activeInputField = null; // Clear active input if keypad is hidden
    }
  });

  // Event listeners for opening modals
  infoIconBtn.addEventListener('click', () => {
    infoModal.style.display = 'flex'; // Use flex to center the modal
  });

  settingsIconBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex'; // Use flex to center the modal
  });

  learningIconBtn.addEventListener('click', () => {
    learningModal.style.display = 'flex'; // Use flex to center the modal
  });

  // Event listeners for closing modals
  infoCloseBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
  });

  settingsCloseBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  learningCloseBtn.addEventListener('click', () => {
    learningModal.style.display = 'none';
  });

  // Close modal if user clicks outside of it
  window.addEventListener('click', (event) => {
    if (event.target == infoModal) {
      infoModal.style.display = 'none';
    }
    if (event.target == learningModal) {
      learningModal.style.display = 'none';
    }
    // Close settings modal if clicked outside, but not if clicking a keypad button
    if (event.target == settingsModal && !event.target.closest('.numeric-keypad')) {
      settingsModal.style.display = 'none';
    }
    // Hide keypads if clicking anywhere else on the document
    if (!event.target.closest('.numeric-keypad') && !event.target.closest('.keypad-toggle-btn') && activeInputField) {
      numericKeypadCrypto.classList.add('hidden');
      numericKeypadFiat.classList.add('hidden');
      activeInputField = null;
    }
  });


  // Event listener for "De Bitcoin a Fiat" conversion button
  btnConvertir.addEventListener("click", async function () {


    const amountValue = amountInput.value.trim();

    if (!amountValue || isNaN(amountValue) || parseFloat(amountValue) <= 0) {
      alert("Por favor, ingresa un valor entero mayor a 0");
      return;
    }

    // Ensure we have fresh data, or re-fetch if null/stale
    if (!cachedExchangeRates) {
      console.log("Cached rates are null, re-fetching for btnConvertir...");
      cachedExchangeRates = await fetchAndDisplayExchangeRates(currentDefaultCurrency);
      if (!cachedExchangeRates) return; // Exit if fetch failed
    }

    const data = cachedExchangeRates; // Use cached data

      const divisa = currencySelector.value;
      const unidad= unidadSelector.value;

      const btcValue = data.BTC;      
      const divisaValue = data.USD[divisa];
      
      let valorUSD=calculateFiatValue(amountValue,unidad,btcValue)
      let valorFiat=valorUSD*divisaValue

      let currencyvalue=btcValue*divisaValue

      // Update info panel labels (already done by fetchAndDisplayExchangeRates, but good to ensure consistency)
      const usdToDefaultCurrencyValue = data.USD[currentDefaultCurrency];
      if (usdToDefaultCurrencyValue) {
        usdToDefaultCurrency.textContent = `1 USD equivale a ${formatNumber(usdToDefaultCurrencyValue)} ${currentDefaultCurrency}`;
      } else {
        usdToDefaultCurrency.textContent = `Error al obtener 1 USD a ${currentDefaultCurrency}`;
      }
      if(divisa!="USD")
      { 
        labelResultado.textContent = `1 BTC equivale a ${formatNumber(currencyvalue)} ${divisa}`;
        labelResultado.classList.remove("hidden");
        labelResultado.classList.add("visible");
      }       
      
      const parsedAmount = parseFloat(amountValue);
      let displayAmount;

      if (unidad === 'BTC') {
        const satsAmount = parsedAmount * 100000000;
        const satsFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
        displayAmount = `${amountValue} ${unidad} (${satsFormatter.format(satsAmount)} sats)`;
      } else if (unidad === 'sats') {
        const btcAmount = parsedAmount / 100000000;
        const satsFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
        displayAmount = `${satsFormatter.format(parsedAmount)} ${unidad} (${parseFloat(btcAmount.toFixed(8))} BTC)`;
      } else {
        displayAmount = `${amountValue} ${unidad}`;
      }

      labelResultadoUSD.textContent = `${displayAmount} equivalen a ${formatNumber(valorUSD)} USD`;

            
      labelResultadoUSD.classList.remove("hidden");
      labelResultadoUSD.classList.add("visible");

      labelResultadoDivisa.textContent = `${displayAmount} equivalen a ${formatNumber(valorFiat)} ${divisa}`;
      labelResultadoDivisa.classList.remove("hidden");
      labelResultadoDivisa.classList.add("visible");


  });

  // Event listener for "De Fiat a Bitcoin" conversion button
  btnConvertirFiat.addEventListener("click", async function () {
    // Ensure we have fresh data, or re-fetch if null/stale
    if (!cachedExchangeRates) {
      console.log("Cached rates are null, re-fetching for btnConvertirFiat...");
      cachedExchangeRates = await fetchAndDisplayExchangeRates(currentDefaultCurrency);
      if (!cachedExchangeRates) return; // Exit if fetch failed
    }
    const fiatAmount = fiatAmountInput.value.trim();

    if (!fiatAmount || isNaN(fiatAmount) || parseFloat(fiatAmount) <= 0) {
      alert("Por favor, ingresa un valor entero mayor a 0");
      return;
    }

    const data = cachedExchangeRates; // Use cached data
      const fiatCurrency = fiatCurrencySelector.value;
      const cryptoUnit = cryptoUnitSelector.value;

      const btcValue = data.BTC;
      const divisaValue = data.USD[fiatCurrency];

      let cryptoAmount = calculateCryptoValue(fiatAmount, fiatCurrency, btcValue, divisaValue);

      if (cryptoUnit === 'sats') {
        cryptoAmount *= 100000000;
      }

      fiatToCryptoResult.textContent = `${fiatAmount} ${fiatCurrency} equivalen a ${formatNumber(cryptoAmount)} ${cryptoUnit}`;
      fiatToCryptoResult.classList.remove("hidden");
      fiatToCryptoResult.classList.add("visible");
  });

});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}