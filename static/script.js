document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("input");
    const output = document.getElementById("output");

    const cipherSelect = document.getElementById("cipher");
    const settings = document.getElementById("settings");

    const encryptBtn = document.getElementById("encryptBtn");
    const decryptBtn = document.getElementById("decryptBtn");
    const processBtn = document.getElementById("processBtn");

    const copyBtn = document.getElementById("copyBtn");
    const swapBtn = document.getElementById("swapBtn");
    const clearBtn = document.getElementById("clearBtn");
    const randomBtn = document.getElementById("randomBtn");

    const infoBtn = document.getElementById("infoBtn");
    const aboutBtn = document.getElementById("aboutBtn");
    const themeBtn = document.getElementById("themeBtn");

    const infoModal = document.getElementById("infoModal");
    const aboutModal = document.getElementById("aboutModal");

    const closeInfo = document.getElementById("closeInfo");
    const closeAbout = document.getElementById("closeAbout");

    const infoTitle = document.getElementById("infoTitle");
    const infoDescription = document.getElementById("infoDescription");
    const infoSteps = document.getElementById("infoSteps");
    const infoExample = document.getElementById("infoExample");
    const infoKey = document.getElementById("infoKey");
    const infoResult = document.getElementById("infoResult");
    const infoExplanation = document.getElementById("infoExplanation");

    const inputCount = document.getElementById("inputCount");

    const status = document.getElementById("status");

    let mode = "encrypt";


    // =====================================================
    // CIPHER INFORMATION
    // =====================================================

    const cipherInfo = {

        caesar: {

            title: "Caesar Cipher",

            description:
                "A substitution cipher that shifts every letter by a fixed number of positions in the alphabet.",

            steps: [
                "Choose a shift value.",
                "Move each letter by that number of positions.",
                "Wrap around when the alphabet reaches Z."
            ],

            example: "HELLO",

            key: "Shift = 3",

            result: "KHOOR",

            explanation:
                "H moves to K, E moves to H, and each following letter is shifted by the same amount."
        },


        vigenere: {

            title: "Vigenère Cipher",

            description:
                "A polyalphabetic cipher that uses a keyword to apply different Caesar shifts to the message.",

            steps: [
                "Choose a keyword.",
                "Repeat the keyword over the message.",
                "Convert each key letter into a numerical shift.",
                "Shift each message letter using its corresponding key letter."
            ],

            example: "HELLO",

            key: "KEYKE",

            result: "RIJVS",

            explanation:
                "Instead of using one shift for every letter, Vigenère uses a different shift based on the keyword."
        },


        playfair: {

            title: "Playfair Cipher",

            description:
                "A digraph cipher that encrypts two letters at a time using a 5×5 letter matrix.",

            steps: [
                "Create a 5×5 matrix from the keyword.",
                "Combine I and J into one cell.",
                "Split the message into pairs.",
                "Apply the same-row, same-column, or rectangle rule."
            ],

            example: "HELLO",

            key: "MONARCH",

            result: "GATLMZ",

            explanation:
                "Two letters are processed together. Their positions in the matrix determine how they are replaced."
        },


        hill: {

            title: "Hill Cipher",

            description:
                "A mathematical cipher that uses matrix multiplication to transform groups of letters.",

            steps: [
                "Convert letters to numbers from 0 to 25.",
                "Group letters into pairs.",
                "Multiply each pair by the key matrix.",
                "Take the result modulo 26."
            ],

            example: "HI",

            key: "[3 3] [2 5]",

            result: "TC",

            explanation:
                "The key matrix performs mathematical transformations on pairs of letters. Decryption uses the inverse matrix."
        },


        base64: {

            title: "Base64",

            description:
                "Base64 converts text or binary data into a representation using 64 printable characters.",

            steps: [
                "Convert the text into bytes.",
                "Represent those bytes as binary.",
                "Group the binary data into 6-bit values.",
                "Map each value to a Base64 character."
            ],

            example: "HELLO",

            key: "No key",

            result: "SEVMTE8=",

            explanation:
                "Base64 is encoding, not encryption. It makes data easier to represent as text."
        }

    };


    // =====================================================
    // THEME
    // =====================================================

    function updateThemeIcon() {

        const dark =
            document.documentElement.classList.contains("dark");

        themeBtn.innerHTML = dark
            ? `
                <i
                    data-lucide="sun"
                    class="h-4 w-4"
                ></i>
            `
            : `
                <i
                    data-lucide="moon"
                    class="h-4 w-4"
                ></i>
            `;

        lucide.createIcons();
    }


    function loadTheme() {

        const savedTheme =
            localStorage.getItem("yencrypto-theme");

        if (savedTheme === "dark") {

            document.documentElement.classList.add(
                "dark"
            );

        } else if (savedTheme === "light") {

            document.documentElement.classList.remove(
                "dark"
            );

        } else {

            // Use system preference for first visit.

            const prefersDark =
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;

            document.documentElement.classList.toggle(
                "dark",
                prefersDark
            );
        }

        updateThemeIcon();
    }


    themeBtn.addEventListener(
        "click",
        () => {

            const dark =
                document.documentElement.classList.toggle(
                    "dark"
                );


            localStorage.setItem(
                "yencrypto-theme",
                dark ? "dark" : "light"
            );


            updateThemeIcon();
        }
    );


    // =====================================================
    // STATUS
    // =====================================================

    function setStatus(
        message,
        type = "ready"
    ) {

        const colors = {

            ready: "bg-emerald-500",

            processing: "bg-blue-500",

            error: "bg-red-500"

        };


        status.replaceChildren();


        const dot =
            document.createElement("span");


        dot.className =
            `h-1.5 w-1.5 rounded-full ${colors[type]}`;


        status.appendChild(dot);


        status.appendChild(
            document.createTextNode(message)
        );
    }


    // =====================================================
    // CHARACTER COUNT
    // =====================================================

    function updateCount() {

        inputCount.textContent =
            `${input.value.length} characters`;
    }


    // =====================================================
    // ENCRYPT / DECRYPT UI
    // =====================================================

    function updateModeUI() {

        if (mode === "encrypt") {

            encryptBtn.classList.add(
                "bg-blue-600",
                "text-white",
                "shadow-sm"
            );

            encryptBtn.classList.remove(
                "text-slate-500",
                "dark:text-slate-400"
            );


            decryptBtn.classList.remove(
                "bg-blue-600",
                "text-white",
                "shadow-sm"
            );

            decryptBtn.classList.add(
                "text-slate-500",
                "dark:text-slate-400"
            );


            document.getElementById(
                "outputLabel"
            ).textContent =
                "Encrypted Result";


        } else {

            decryptBtn.classList.add(
                "bg-blue-600",
                "text-white",
                "shadow-sm"
            );

            decryptBtn.classList.remove(
                "text-slate-500",
                "dark:text-slate-400"
            );


            encryptBtn.classList.remove(
                "bg-blue-600",
                "text-white",
                "shadow-sm"
            );

            encryptBtn.classList.add(
                "text-slate-500",
                "dark:text-slate-400"
            );


            document.getElementById(
                "outputLabel"
            ).textContent =
                "Decrypted Result";
        }
    }


    // =====================================================
    // SETTINGS
    // =====================================================

    function renderSettings() {

        const cipher =
            cipherSelect.value;


        // -------------------------------------------------
        // CAESAR
        // -------------------------------------------------

        if (cipher === "caesar") {

            settings.innerHTML = `
                <div class="space-y-3">

                    <div class="flex items-center justify-between">

                        <div>

                            <p class="text-sm font-semibold">
                                Shift Amount
                            </p>

                            <p class="text-xs text-slate-400">
                                Choose 0–25
                            </p>

                        </div>


                        <input
                            id="shift"
                            type="number"
                            min="0"
                            max="25"
                            value="3"
                            class="h-10 w-20 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >

                    </div>


                    <input
                        id="slider"
                        type="range"
                        min="0"
                        max="25"
                        value="3"
                        class="w-full accent-blue-600"
                    >


                    <div class="flex justify-between text-[10px] text-slate-400">

                        <span>0</span>

                        <span>13</span>

                        <span>25</span>

                    </div>

                </div>
            `;

        }


        // -------------------------------------------------
        // VIGENERE
        // -------------------------------------------------

        else if (cipher === "vigenere") {

            settings.innerHTML = `
                <div>

                    <label class="text-sm font-semibold">
                        Keyword
                    </label>


                    <input
                        id="key"
                        type="text"
                        maxlength="100"
                        autocomplete="off"
                        placeholder="Example: SECRET"
                        class="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >

                </div>
            `;
        }


        // -------------------------------------------------
        // PLAYFAIR
        // -------------------------------------------------

        else if (cipher === "playfair") {

            settings.innerHTML = `
                <div>

                    <label class="text-sm font-semibold">
                        Keyword
                    </label>


                    <input
                        id="key"
                        type="text"
                        maxlength="100"
                        autocomplete="off"
                        placeholder="Example: MONARCH"
                        class="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >


                    <p class="mt-1 text-xs text-slate-400">
                        I and J share one cell.
                    </p>

                </div>
            `;
        }


        // -------------------------------------------------
        // HILL
        // -------------------------------------------------

        else if (cipher === "hill") {

            settings.innerHTML = `
                <div>

                    <div class="flex items-center justify-between">

                        <div>

                            <p class="text-sm font-semibold">
                                2 × 2 Key Matrix
                            </p>

                            <p class="text-xs text-slate-400">
                                Default matrix is valid
                            </p>

                        </div>

                    </div>


                    <div class="mt-2 grid grid-cols-2 gap-2">

                        <input
                            id="a"
                            type="number"
                            value="3"
                            class="h-10 rounded-xl border border-slate-200 bg-slate-50 text-center outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >


                        <input
                            id="b"
                            type="number"
                            value="3"
                            class="h-10 rounded-xl border border-slate-200 bg-slate-50 text-center outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >


                        <input
                            id="c"
                            type="number"
                            value="2"
                            class="h-10 rounded-xl border border-slate-200 bg-slate-50 text-center outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >


                        <input
                            id="d"
                            type="number"
                            value="5"
                            class="h-10 rounded-xl border border-slate-200 bg-slate-50 text-center outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >

                    </div>

                </div>
            `;
        }


        // -------------------------------------------------
        // BASE64
        // -------------------------------------------------

        else {

            settings.innerHTML = `
                <div class="flex h-full items-center rounded-xl border border-blue-100 bg-blue-50 px-4 dark:border-blue-900/40 dark:bg-blue-950/30">

                    <div class="flex items-center gap-2">

                        <i
                            data-lucide="info"
                            class="h-4 w-4 text-blue-500"
                        ></i>


                        <div>

                            <p class="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                No key required
                            </p>

                            <p class="text-[10px] text-blue-600 dark:text-blue-400">
                                Base64 encoding / decoding
                            </p>

                        </div>

                    </div>

                </div>
            `;
        }


        lucide.createIcons();

        setupDynamicInputs();
    }


    // =====================================================
    // DYNAMIC INPUTS
    // =====================================================

    function setupDynamicInputs() {

        const shift =
            document.getElementById("shift");

        const slider =
            document.getElementById("slider");


        if (shift && slider) {

            shift.addEventListener(
                "input",
                () => {

                    let value =
                        Number(shift.value);


                    if (Number.isNaN(value)) {
                        value = 0;
                    }


                    value =
                        Math.max(
                            0,
                            Math.min(
                                25,
                                value
                            )
                        );


                    shift.value =
                        value;

                    slider.value =
                        value;
                }
            );


            slider.addEventListener(
                "input",
                () => {

                    shift.value =
                        slider.value;
                }
            );
        }
    }


    // =====================================================
    // BUILD REQUEST
    // =====================================================

    function buildRequest() {

        const cipher =
            cipherSelect.value;


        const data = {

            text: input.value,

            cipher: cipher,

            mode: mode

        };


        if (cipher === "caesar") {

            data.shift =
                Number(
                    document.getElementById(
                        "shift"
                    ).value
                );
        }


        if (
            cipher === "vigenere" ||
            cipher === "playfair"
        ) {

            data.key =
                document.getElementById(
                    "key"
                ).value.trim();
        }


        if (cipher === "hill") {

            data.a =
                Number(
                    document.getElementById("a").value
                );

            data.b =
                Number(
                    document.getElementById("b").value
                );

            data.c =
                Number(
                    document.getElementById("c").value
                );

            data.d =
                Number(
                    document.getElementById("d").value
                );
        }


        return data;
    }


    // =====================================================
    // PROCESS
    // =====================================================

    async function processText() {

        updateCount();


        if (!input.value) {

            output.value = "";

            copyBtn.disabled = true;

            setStatus("Ready");

            return;
        }


        setStatus(
            "Processing...",
            "processing"
        );


        processBtn.disabled = true;


        try {

            const response =
                await fetch(
                    "/process",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(
                            buildRequest()
                        )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to process the text."
                );
            }


            output.value =
                typeof data.result === "string"
                    ? data.result
                    : "";


            copyBtn.disabled =
                !data.result;


            setStatus(
                "Processed successfully"
            );


        } catch (error) {

            output.value = "";

            copyBtn.disabled = true;


            setStatus(
                error.message,
                "error"
            );


        } finally {

            processBtn.disabled = false;
        }
    }


    // =====================================================
    // EVENTS
    // =====================================================

    cipherSelect.addEventListener(
        "change",
        () => {

            output.value = "";

            copyBtn.disabled = true;

            renderSettings();

            setStatus("Ready");
        }
    );


    encryptBtn.addEventListener(
        "click",
        () => {

            mode = "encrypt";

            updateModeUI();


            if (input.value) {
                processText();
            }
        }
    );


    decryptBtn.addEventListener(
        "click",
        () => {

            mode = "decrypt";

            updateModeUI();


            if (input.value) {
                processText();
            }
        }
    );


    processBtn.addEventListener(
        "click",
        processText
    );


    input.addEventListener(
        "input",
        updateCount
    );


    // =====================================================
    // COPY
    // =====================================================

    copyBtn.addEventListener(
        "click",
        async () => {

            if (!output.value) return;


            try {

                await navigator.clipboard.writeText(
                    output.value
                );


                const oldHTML =
                    copyBtn.innerHTML;


                copyBtn.innerHTML = `
                    <i
                        data-lucide="check"
                        class="h-3.5 w-3.5"
                    ></i>
                    Copied
                `;


                lucide.createIcons();


                setStatus(
                    "Copied to clipboard"
                );


                setTimeout(
                    () => {

                        copyBtn.innerHTML =
                            oldHTML;

                        lucide.createIcons();

                    },
                    1200
                );


            } catch {

                output.select();

                document.execCommand("copy");

                setStatus(
                    "Copied to clipboard"
                );
            }
        }
    );


    // =====================================================
    // SWAP
    // =====================================================

    swapBtn.addEventListener(
        "click",
        () => {

            if (!output.value) return;


            input.value =
                output.value;


            mode =
                mode === "encrypt"
                    ? "decrypt"
                    : "encrypt";


            updateModeUI();

            updateCount();

            processText();
        }
    );


    // =====================================================
    // CLEAR
    // =====================================================

    clearBtn.addEventListener(
        "click",
        () => {

            input.value = "";

            output.value = "";

            updateCount();

            copyBtn.disabled = true;

            setStatus("Ready");

            input.focus();
        }
    );


    // =====================================================
    // RANDOM
    // =====================================================

    randomBtn.addEventListener(
        "click",
        () => {

            const cipher =
                cipherSelect.value;


            if (cipher === "caesar") {

                const value =
                    Math.floor(
                        Math.random() * 26
                    );


                document.getElementById(
                    "shift"
                ).value = value;


                document.getElementById(
                    "slider"
                ).value = value;
            }


            else if (
                cipher === "vigenere" ||
                cipher === "playfair"
            ) {

                const keys = [
                    "SECRET",
                    "CRYPTO",
                    "CIPHER",
                    "MONARCH",
                    "YEN"
                ];


                document.getElementById(
                    "key"
                ).value =
                    keys[
                        Math.floor(
                            Math.random() *
                            keys.length
                        )
                    ];
            }


            else if (cipher === "hill") {

                document.getElementById(
                    "a"
                ).value = 3;

                document.getElementById(
                    "b"
                ).value = 3;

                document.getElementById(
                    "c"
                ).value = 2;

                document.getElementById(
                    "d"
                ).value = 5;
            }


            if (input.value) {
                processText();
            }
        }
    );


    // =====================================================
    // HOW IT WORKS
    // =====================================================

    infoBtn.addEventListener(
        "click",
        () => {

            const info =
                cipherInfo[
                    cipherSelect.value
                ];


            infoTitle.textContent =
                info.title;


            infoDescription.textContent =
                info.description;


            infoExample.textContent =
                info.example;


            infoKey.textContent =
                info.key;


            infoResult.textContent =
                info.result;


            infoExplanation.textContent =
                info.explanation;


            infoSteps.replaceChildren();


            info.steps.forEach(
                (step, index) => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "flex gap-3";


                    const number =
                        document.createElement(
                            "div"
                        );


                    number.className =
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300";


                    number.textContent =
                        String(index + 1);


                    const text =
                        document.createElement(
                            "p"
                        );


                    text.className =
                        "pt-0.5 text-sm text-slate-600 dark:text-slate-300";


                    text.textContent =
                        step;


                    row.appendChild(number);

                    row.appendChild(text);

                    infoSteps.appendChild(row);
                }
            );


            infoModal.classList.remove(
                "hidden"
            );


            lucide.createIcons();
        }
    );


    // =====================================================
    // CLOSE INFO
    // =====================================================

    closeInfo.addEventListener(
        "click",
        () => {

            infoModal.classList.add(
                "hidden"
            );
        }
    );


    // =====================================================
    // ABOUT
    // =====================================================

    aboutBtn.addEventListener(
        "click",
        () => {

            aboutModal.classList.remove(
                "hidden"
            );
        }
    );


    // =====================================================
    // CLOSE ABOUT
    // =====================================================

    closeAbout.addEventListener(
        "click",
        () => {

            aboutModal.classList.add(
                "hidden"
            );
        }
    );


    // =====================================================
    // CLOSE MODALS
    // =====================================================

    [infoModal, aboutModal].forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        modal.classList.add(
                            "hidden"
                        );
                    }
                }
            );
        }
    );


    // =====================================================
    // START APPLICATION
    // =====================================================

    loadTheme();

    updateModeUI();

    renderSettings();

    updateCount();

    lucide.createIcons();

});