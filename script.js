(() => {

    const display = document.getElementById("display");
    const historyLine = document.getElementById("historyLine");
    const historyList = document.getElementById("historyList");
    const degToggle = document.getElementById("degToggle");

    let angleMode = "RAD";
    let lastAnswer = 0;
    let history = [];
    let memoryVal = 0;

    /* ---------------------------
       HELPER FUNCTIONS
    ----------------------------*/

    const toRad = (x) => x * Math.PI / 180;
    const toDeg = (x) => x * 180 / Math.PI;

    function factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    function buildScope() {
        const trigIn = angleMode === "DEG"
            ? (f) => (x) => f(toRad(x))
            : (f) => (x) => f(x);

        const atrigOut = angleMode === "DEG"
            ? (f) => (x) => toDeg(f(x))
            : (f) => (x) => f(x);

        return {
            pi: Math.PI,
            e: Math.E,
            Ans: lastAnswer,
            sqrt: Math.sqrt,
            log: (x) => Math.log10(x),
            ln: Math.log,
            sin: trigIn(Math.sin),
            cos: trigIn(Math.cos),
            tan: trigIn(Math.tan),
            asin: atrigOut(Math.asin),
            acos: atrigOut(Math.acos),
            atan: atrigOut(Math.atan),
            fact: factorial,
        };
    }

    /* Replace ! with fact() */
    function replaceFactorial(expr) {
        return expr.replace(/(\d+|\([^()]*\))!/g, "fact($1)");
    }

    function preprocess(input) {
        if (!input) return "";

        let expr = input;

        expr = expr.replace(/π/g, "pi");
        expr = expr.replace(/√/g, "sqrt");
        expr = expr.replace(/\^/g, "**");

        expr = replaceFactorial(expr);

        return expr;
    }

    function evaluateExpression(input) {
        const expr = preprocess(input);
        const scope = buildScope();

        try {
            const fn = new Function("scope", `
                with (scope) {
                    return (${expr});
                }
            `);

            let result = fn(scope);

            if (!isFinite(result)) return NaN;
            return result;
        } catch {
            return NaN;
        }
    }

    /* ---------------------------
       HISTORY
    ----------------------------*/

    function addHistory(exp, res) {
        history.push({ exp, res });
        if (history.length > 100) history.shift();
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = "";

        for (let i = history.length - 1; i >= 0; i--) {
            const li = document.createElement("li");

            const exp = document.createElement("div");
            exp.className = "history-exp";
            exp.textContent = history[i].exp;

            const res = document.createElement("div");
            res.className = "history-res";
            res.textContent = history[i].res;

            li.appendChild(exp);
            li.appendChild(res);

            li.onclick = () => {
                display.value = history[i].res;
                historyLine.textContent = history[i].exp + " =";
            };

            historyList.appendChild(li);
        }
    }

    /* ---------------------------
       MAIN OPERATIONS
    ----------------------------*/

    function handleEquals() {
        const expr = display.value.trim();
        if (!expr) return;

        const result = evaluateExpression(expr);
        if (isNaN(result)) {
            historyLine.textContent = "Error";
            return;
        }

        const clean = +parseFloat(result.toPrecision(14));
        display.value = clean;
        lastAnswer = clean;

        historyLine.textContent = expr + " =";
        addHistory(expr, clean);
    }

    function insertText(text) {
        const start = display.selectionStart;
        const end = display.selectionEnd;

        const before = display.value.slice(0, start);
        const after = display.value.slice(end);

        display.value = before + text + after;
        display.setSelectionRange(start + text.length, start + text.length);
        display.focus();
    }

    /* ---------------------------
       BUTTON CLICKS
    ----------------------------*/

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const insert = btn.dataset.insert;
        const fn = btn.dataset.fn;
        const action = btn.dataset.action;

        if (insert) return insertText(insert);

        if (fn) {
            if (fn === "fact") return insertText("!");
            return insertText(fn + "(");
        }

        if (action) {
            switch (action) {
                case "clear":
                    display.value = "";
                    historyLine.textContent = "";
                    break;

                case "backspace":
                    display.value = display.value.slice(0, -1);
                    break;

                case "equals":
                    handleEquals();
                    break;

                /* Memory functions */
                case "mc":
                    memoryVal = 0;
                    break;

                case "mr":
                    insertText(String(memoryVal));
                    break;

                case "mplus":
                    memoryVal += evaluateExpression(display.value || "0");
                    break;

                case "mminus":
                    memoryVal -= evaluateExpression(display.value || "0");
                    break;
            }
        }
    });

    /* ---------------------------
       DEG / RAD toggle
    ----------------------------*/

    degToggle.addEventListener("change", () => {
        angleMode = degToggle.checked ? "DEG" : "RAD";
    });

    /* ENTER key = equals */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEquals();
        }
    });

})();
