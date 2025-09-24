// ==UserScript==
// @name         autoRefreshUsVisa
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       jarvixwang
// @match        *://portal.ustraveldocs.com/applicanthome
// @match        *://portal.ustraveldocs.com/appointmentcancellation*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ustraveldocs.com
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @resource     IMPORTED_CSS https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css
// @grant        GM_notification
// @grant        unsafeWindow
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
    const toastr_css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(toastr_css);
    // Define toastr variable
    const toastr = window.toastr;
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "0",
        "extendedTimeOut": "0",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    console.log("进入autofresh主程序! " + new Date());
    setTimeout(function () {
        selectEnglishLanguage(); // Select English language
        setTimeout(function () {
            const result = getAppointmentDate(); // Get appointment date
            if (result) {
                if (result.flag) {
                    toastr.success(result.message);
                } else {
                    toastr.warning(result.message);
                }
            }

            setTimeout(refreshDate, 60000);// Refresh the page // Wait for 60 seconds
        }, 5000); // Wait for 5 seconds
    }, 0); // Wait for next event loop iteration

    function selectEnglishLanguage() {
        console.log("检查英语作为页面显示语言");
        const selectors = document.getElementsByTagName('select');
        let languageSelector = null;
        for (let i = 0; i < selectors.length; i++) {
            if (selectors[i].hasAttribute('onchange') && selectors[i].getAttribute('onchange').toString() === 'changeLanguage()') {
                console.log("找到了语言选择下拉框");
                languageSelector = selectors[i];
                break;
            }
        }
        //console.log(languageSelector);
        if (languageSelector && languageSelector.value !== 'English') {
            console.log("当前语言非英语，设置语言为英语");
            languageSelector.value = 'English'; // 语言不是英语时设置语言为英语
            languageSelector.dispatchEvent(new Event('change'));
        } else {
            console.log("当前语言是英语，无需操作");
        }
    }

    function refreshDate() {

        console.log("开始刷新, " + new Date());

        const links = document.getElementsByTagName('a');
        for (let i = 0; i < links.length; i++) {
            if (links[i].textContent === 'Cancel Appointment' && links[i].hasAttribute('onclick')) {
                console.log("找到了cancel Appointment的按钮")
                links[i].click();
                break;
            }
        }
        console.log("刷新完毕");
    }
    function parseDateFromLabel(inputStr) {
        const regex = /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}/;
        const match = inputStr.match(regex);
        let resultDate = "";
        if (match) {
            resultDate = match[0];
        }
        return resultDate
    }
    function getAppointmentDate() {

        console.log("开始获取预约日期")
        let appointmentDateStr = "";
        let availableDateStr = "";
        const tbody = document.evaluate('//*[@id="j_id0:SiteTemplate:j_id120"]/table/tbody', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (tbody === null) {
            console.log("当前未检测到tbody, 退出, 等待下次检测");
            return;
        }
        const trs = tbody.querySelectorAll('tr');
        for (let i = 0; i < trs.length; i++) {
            var trText = trs[i].textContent.toString().trim();
            if (trText.includes('Appointment Date:')) {
                const tds = trs[i].querySelectorAll('td');
                const nextTd = tds[1];
                appointmentDateStr = nextTd.textContent.trim();
                console.log("找到当前已预约日期:", appointmentDateStr);
            } else if (trText.includes('First available appointment slots')) {
                const dateLabel = trText;
                availableDateStr = parseDateFromLabel(dateLabel);
                console.log("找到最新可预约日期:", availableDateStr);
                break;
            }
        }
        console.log("已获取完预约日期");
        const appointmentDateObj = new Date(Date.parse(appointmentDateStr));
        const availableDateObj = new Date(Date.parse(availableDateStr));
        const hasEarlierSlot = availableDateObj < appointmentDateObj;
        console.log("是否有更早的slot: " + hasEarlierSlot);

        const message = "运行时间: " + new Date() + "</br>已预约日期: " + appointmentDateStr + "</br>最新可预约日期: " + availableDateStr + "</br>是否有更早的slot: " + hasEarlierSlot;
        return {
            "flag": hasEarlierSlot,
            "message": message
        };

    }
})();