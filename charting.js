var data;
var chart1 = document.getElementById("daysChart");
var chartInstance1;
var chart2 = document.getElementById("monthsChart");
var chartInstance2;
var chart4 = document.getElementById("pieChart");
var chartInstance4;
var chart5 = document.getElementById("weekdayChart");
var chartInstance5;
var chart6 = document.getElementById("hourChart");
var chartInstance6;

var exampleImage = document.getElementById("example")

var errormessage = document.getElementById("error-message")
errormessage.style.display = "none"

var chartFontSize = 20;

//Object containing all statistic data
var dataObject

var avgChart = []


var logTextbox = document.getElementById("uploadedText")
logTextbox.style.display = "none"

var messageStats = document.getElementById("messageCount");

var charts = document.getElementsByClassName("chart")
for (chart of charts) {
    chart.style.display = "none"
}

var maintainAspect = true;

var shareButton = document.getElementById("shareButton")
shareButton.addEventListener('click', function () {

    document.getElementById("shareArea").style.display = "inline"

})
shareButton.style.display = "none"

var generateButton = document.getElementById("generateButton")
generateButton.addEventListener('click', function () {

    loadingSpinner.style.display = "block";

    sendStatData()

    document.getElementById("copySuccess").className += "copy-success"
    setTimeout(function () {
        document.getElementById("copySuccess").className = "copy-idle "
    }, 2000)

})

var loadingSpinner = document.getElementById("loadingSpinner")
loadingSpinner.style.display = "none";

/////////////////////////////////////////////////////////////////////////////////

loadStatsData()

function loadStatsData() {


    var url = new URL(window.location.href);
    var analysisID = url.searchParams.get("id");

    if (analysisID != null) {

        exampleImage.style.display = "none"

        loadingSpinner.style.display = "block";

        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function () {

            if (this.readyState == 4 && this.status == 200) {

                console.log(this.repsonse)

                if(this.response==="ID_invalid"){
                    loadingSpinner.style.display = "none";

                    errormessage.style.display = "block"
                    errormessage.innerHTML = "The statistics with the ID " + analysisID + " could not be found. This could be due to a wrong ID or the statistics have already been deleted (happens automatically after seven days)"
                }
                else{
                    generateCharts(JSON.parse(this.response));
                }

                

            }

        };
        xhttp.open("GET", "https://teleg-telegramalyzer-project.1d35.starter-us-east-1.openshiftapps.com/stats/" + analysisID, true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send();
    }
    



}

function generateCharts(content) {

    errormessage.style.display = "none"


    createAvgMessagesChart(content.avgChart)
    createPieChart(content.pieChartLabel, content.pieChartData)
    createAllMessagesCharts(content.allDaysChartData, content.allDaysChartLabel, content.monthsChartData, content.monthsChartLabel)
    createWeekdayChart(false, content.weekdayChartData, content.weekdayChartLabel, content.hourChartData, content.hourChartLabel)
    createHeartsChart(content.heartNumber)
    createEmojiChart(content.emojiChartData)

    displayChart("chart")

    loadingSpinner.style.display = "none";
}

function sendStatData() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {

        loadingSpinner.style.display = "none";

        if (this.readyState == 4 && this.status == 200) {

            //Hide generate button
            generateButton.style.display = "none"

            //Writing link to text box
            document.getElementById("shareText").value = "www.telegramalyzer.com?id=" + this.response.replace(/"/g, "")

            //Copying link to clipboard
            copyToClipboard()

            //Show success message
            document.getElementById("copySuccess").className += "copy-success"
            setTimeout(function () {
                document.getElementById("copySuccess").className = "copy-idle "
            }, 2000)
        }

        if (this.status == 418) {
            document.getElementById("shareText").value = "An error occured while generating the link"
        }

        if (this.status == 429) {
            alert("You are making too many attempts, please try again later")
        }
    };
    //xhttp.open("POST", "http://127.0.0.1:3000/stats", true);
    xhttp.open("POST", "https://teleg-telegramalyzer-project.1d35.starter-us-east-1.openshiftapps.com/stats", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("dataO=" + dataObject);
}

function copyToClipboard() {
    var copyText = document.getElementById("shareText");
    copyText.select();
    document.execCommand("Copy");
}

function fileChoose(files) {



    for (var i = 0, f; f = files[i]; i++) {

        // nur TXT-files
        if (!f.type.match('text/plain')) {
            continue;
        }

        loadingSpinner.style.display = "block";

        var reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {



                //Show the text box. "Block" would lead to ignoring the text-align 
                logTextbox.style.display = "inline"
                logTextbox.textContent = reader.result

                data = reader.result

                processData();
            };
        })(f);

        // Klartext mit Zeichenkodierung UTF-8 auslesen.
        reader.readAsText(f);
    }
}

function processData() {


    data = data.toString();

    data = data.replace(/\u00f6/g, 'oe')
    data = data.replace(/\u00fc/g, 'ue')
    data = data.replace(/\u00e4/g, 'ae')
    data = data.replace(/\u00df/g, 'ss')
    data = data.replace(".", "")
    data = data.toLowerCase()


    createCharts();
}

function matchMessagesPersons() {

    //Regex that matches messages to people
    var reUltra = /(\d{2}\.\d{2}\.\d{4})\s(\d{2}\:\d{2}\:\d{2})\,\s(.+?):([^]+?)(?=\d{2}\.\d{2}\.\d{4}\s\d{2}\:\d{2}\:\d{2}\,\s.+?:)/g

    var localData = data
    var foundMessages = localData.match(reUltra)
    var messagePersonMatches = []

    for (message of foundMessages) {
        var reUltra = /(\d{2}\.\d{2}\.\d{4})\s(\d{2}\:\d{2}\:\d{2})\,\s(.+?):([^]+)/g
        var tempFound = reUltra.exec(message)
        if (tempFound != null) {
            messagePersonMatches.push({ "date": tempFound[1], "person": tempFound[3].replace(/\(you\)/g, ""), "content": tempFound[4] })
        }

    }


    return messagePersonMatches;

}

function createCharts() {

    errormessage.style.display = "none"

    exampleImage.style.display = "none"

    createPieChart()
    createAllMessagesCharts()
    createHeartsChart()
    createEmojiChart()
    createAvgMessagesChart()


    displayChart("chart")

    loadingSpinner.style.display = "none";

    shareButton.style.display = "block"

    generateShareCode();

}

function createAvgMessagesChart(preData) {

    if (!preData) {

        var matchedMessages = matchMessagesPersons();

        //Takes every message, counts how many words are in the message and adds it together based on which user it is from
        var avgPersonMessages = matchedMessages.reduce(function (acc, curr) {
            if (curr.content.startsWith("[[")) {
                return acc;
            }

            var reWord = /\w+/g
            var wordCount = curr.content.match(reWord)
            if (wordCount != null) wordCount = wordCount.length
            if (typeof acc[curr.person] == 'undefined') {
                acc[curr.person] = { wordsTotal: wordCount, messageCount: 1, averageWords: wordCount / 1 }
            }
            else {
                acc[curr.person].wordsTotal += wordCount
                acc[curr.person].messageCount += 1
                acc[curr.person].averageWords = acc[curr.person].wordsTotal / acc[curr.person].messageCount
            }

            return acc;

        }, {});

        for (i in avgPersonMessages) {

            var tempAvg = Math.round(avgPersonMessages[i].averageWords * 100) / 100

            avgChart.push({ name: i, avg: tempAvg })

            messageStats.innerHTML += "On average <personName>" + i + "</personName> wrote " + tempAvg + " words per message <br>"
        }

    }

    else{

        messageStats.innerHTML = "The whole chat history contains " + preData[0].toString().replace(/[&<>"'/]/g, "") + " messages <br><br>"

        for(x=1; x < preData.length; x++){
            messageStats.innerHTML += "On average <personName>" + preData[x].name.replace(/[&<>"'/]/g, "") + "</personName> wrote " + preData[x].avg.toString().replace(/[&<>"'/]/g, "") + " words per message <br>"
        }

    }






}

function createWeekdayChart(foundDates, preData, preLabels, preData2, preLabel2) {

    if (foundDates != false) {

        var mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0, sun = 0;
        var hourArray = []

        for (var x = 0; x < foundDates.length; x++) {

            // //The regex is in here because due to the "/g" it matches globally. Setting it outside would lead to it returning null every second loop
            // var reDate = /(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\:(\d{2})\:(\d{2})\,/g;
            // var tempFound = reDate.exec(foundDates[x])
            // if (tempFound != null) {
            //     //var newDate = new Date(tempFound[3] - 1, tempFound[2], tempFound[1], tempFound[4], tempFound[5], tempFound[6])
            //     hourArray.push(tempFound[4])
            //     var newDate = new Date(tempFound[3], tempFound[2] - 1, tempFound[1]);


            var newDate = foundDates[x]
            hourArray.push(parseInt(newDate.getHours())+1)

                //How was the weekday distribution?
                switch (newDate.getDay()) {
                    case 1:
                        mon ++
                        break;
                    case 2:
                        tue++
                        break;
                    case 3:
                        wed++
                        break;
                    case 4:
                        thu++
                        break;
                    case 5:
                        fri++
                        break;
                    case 6:
                        sat++
                        break;
                    case 0:
                        sun++
                        break;
                    default:

                }

            
        }

        var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        var messageCount = []
        messageCount.push(mon)
        messageCount.push(tue)
        messageCount.push(wed)
        messageCount.push(thu)
        messageCount.push(fri)
        messageCount.push(sat)
        messageCount.push(sun)

        var data = []
        var labels = []


        //Adding data to chart1
        for (x = 0; x < days.length; x++) {
            labels.push(days[x])
            data.push(messageCount[x].toString())
        }

    }

    else {
        var data = preData
        var labels = preLabels
    }



    //Checking if chart1 already exists and destroys it
    if (chartInstance5 != null) {
        chartInstance5.destroy();
    }


    chartInstance5 = new Chart(chart5, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{

                data: data,
                backgroundColor: [
                    'rgba(245, 154, 53,0.8)',
                    'rgba(220,20,60, 0.8)',
                    'rgba(255,215,0, 0.8)',
                    'rgba(34,139,34, 0.8)',
                    'rgba(32,178,170, 0.8)',
                    'rgba(175,238,238, 0.8)',
                    'rgba(30,144,255, 0.8)'
                ]
            }]
        },
        options: {

            maintainAspectRatio: maintainAspect,

            scales: {
                xAxes: [{
                    time: {
                        unit: 'day'
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            title: {
                display: true,
                text: 'Days of the week',
                fontSize: chartFontSize
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });






    if (foundDates != false) {

        var hourFrequency = hourArray.reduce(function (acc, curr) {
            if (typeof acc[curr] == 'undefined') {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }

            return acc;
        }, {});

        var hourFrequencyArray = []

        for (var key in hourFrequency) {

            if (hourFrequency.hasOwnProperty(key)) {
                hourFrequencyArray.push({ hour: key, frequency: hourFrequency[key] })
            }

        }


        // hourFrequencyArray.sort(function (a, b) {

        //     var keyA = a.hour,
        //         keyB = b.hour;

        //     // Compare the 2 dates
        //     if (keyA < keyB) {
        //         return -1;
        //     }
        //     if (keyA > keyB) {
        //         return 1;
        //     }

        //     return 0;
        // });


        var data = []
        var labels = []


        //Adding data to chart1
        for (x of hourFrequencyArray) {
            labels.push(x.hour)
            data.push(x.frequency)
        }

    }
    else {

        var data = preData2
        var labels = preLabel2

    }





    if (chartInstance6 != null) {
        chartInstance6.destroy();
    }

    //initializing chart1
    chartInstance6 = new Chart(chart6, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{

                data: data,
                backgroundColor:
                    'rgba(30,144,255, 0.8)'

            }]
        },
        options: {

            maintainAspectRatio: maintainAspect,

            scales: {
                xAxes: [{
                    time: {
                        unit: 'hour'
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            title: {
                display: true,
                text: 'When do you write in 24-hours',
                fontSize: chartFontSize
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });



}

function createHighestDaysChart(dayOccurences) {

    console.log("Creating highest day chart")

    var highestDay;
    var highestOccurence;

    for (var key in dayOccurences) {



        if (dayOccurences.hasOwnProperty(key)) {

            if (highestDay == null) {
                highestDay = key
                highestOccurence = dayOccurences[key]
                continue
            }

            if (dayOccurences[key] > highestOccurence) {
                highestDay = key
                highestOccurence = dayOccurences[key]
            }


        }
    }



    displayChart("chart-3")

}

var emojiChartData;

function createEmojiChart(emojiData) {

    emojiChartData = []
    var buttonContainer = document.getElementById("emoji-buttons");
    buttonContainer.innerHTML = "";

    if (emojiData == null) {

        var reEmoji = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g

        var tempData = data;
        var foundEmojis = tempData.match(reEmoji)



        //Check how often a specific emoji is written and reduce array to emoji plus the number of its occurences
        var emojiOccurences = foundEmojis.reduce(function (acc, curr) {
            if (typeof acc[curr] == 'undefined') {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }

            return acc;
        }, {});

        emojiFrequencyArray = []

        for (var key in emojiOccurences) {
            if (emojiOccurences.hasOwnProperty(key)) {
                emojiFrequencyArray.push({ emoji: key, frequency: emojiOccurences[key] })
            }

        }


        emojiFrequencyArray.sort(function (a, b) {

            var keyA = a.frequency,
                keyB = b.frequency;

            // Compare the 2 dates
            if (keyA > keyB) {
                return -1;
            }
            if (keyA < keyB) {
                return 1;
            }

            return 0;
        });



        document.getElementById("emojiChart").innerHTML = "Top 10 Emojis for all <br><br>"

        if(emojiFrequencyArray!=null  && emojiFrequencyArray.length>0){

            var numberofEmojis;

            if(emojiFrequencyArray.length <10){
                numberofEmojis = emojiFrequencyArray.length
            }

            for (var x = 0; x < numberofEmojis; x++) {
                document.getElementById("emojiChart").innerHTML += emojiFrequencyArray[x].emoji + ": " + emojiFrequencyArray[x].frequency + "<br>"
            }
    
            emojiFrequencyArray = emojiFrequencyArray.slice(0, 11)
    
            insertEmojiButton("All", emojiFrequencyArray);
            changeEmojis("All", emojiFrequencyArray)
    
            var matchedMessages = matchMessagesPersons();
    
            var persons = {}
    
            for (var x = 0; x < matchedMessages.length; x++) {
                var personString = matchedMessages[x].person
                if (persons.personString) {
                    continue;
                }
    
                persons[personString] = []
            }
    
    
    
            var matchedEmojis = []
    
            for (var x = 0; x < matchedMessages.length; x++) {
                var personString = matchedMessages[x].person
                var match = matchedMessages[x].content.match(reEmoji)
                if (match != null) {
                    for (y of match) {
    
                        persons[personString].push(y)
    
                    }
                }
    
            }
    
    
    
            for (var p in persons) {
                if (persons.hasOwnProperty(p)) {
                    //Check how often a specific emoji is written and reduce array to emoji plus the number of its occurences
                    var emojiOccurences = persons[p].reduce(function (acc, curr) {
                        if (typeof acc[curr] == 'undefined') {
                            acc[curr] = 1;
                        } else {
                            acc[curr] += 1;
                        }
    
                        return acc;
                    }, {});
    
                    let emojiFrequencyArray = []
    
                    for (var key in emojiOccurences) {
                        if (emojiOccurences.hasOwnProperty(key)) {
                            emojiFrequencyArray.push({ emoji: key, frequency: emojiOccurences[key] })
                        }
    
                    }
    
    
                    emojiFrequencyArray.sort(function (a, b) {
    
                        var keyA = a.frequency,
                            keyB = b.frequency;
    
                        // Compare the 2 dates
                        if (keyA > keyB) {
                            return -1;
                        }
                        if (keyA < keyB) {
                            return 1;
                        }
    
                        return 0;
                    });
    
    
                    let name = p;
    
                    emojiFrequencyArray = emojiFrequencyArray.slice(0, 11)
    
                    insertEmojiButton(name, emojiFrequencyArray);
    
                }
            }

        }

        

    }

    else {

        for (x of emojiData) {

            insertEmojiButton(x.name, x.arr)

            if (x.name = "All"){
                console.log("All")
                changeEmojis("All", x.arr)
            } 

        }

    }

}

function insertEmojiButton(name, array) {

    // 1. Create the button
    let button = document.createElement("button");
    button.innerHTML = name;
    button.className = "emoji-button"

    // 2. Append somewhere
    var buttonContainer = document.getElementById("emoji-buttons");
    buttonContainer.appendChild(button);

    //Create br
    var br = document.createElement("br");
    buttonContainer.appendChild(br);


    // 3. Add event handler
    button.addEventListener('click', function () {
        changeEmojis(name, array)
    });

    //Save to array for later data transmission
    emojiChartData.push({ name: name, arr: array })


}

function changeEmojis(name, arr) {
    var emojiChart = document.getElementById("emojiChart")

    emojiChart.innerHTML = ""
    emojiChart.innerHTML = "Top 10 Emojis for " + name + " <br><br>"

    var limit = 10;
    if (arr.length < limit) {
        limit = arr.length
    }

    for (var x = 0; x < limit; x++) {
        emojiChart.innerHTML += arr[x].emoji + ": " + arr[x].frequency + "<br>"
    }
}

function createPieChart(preLabel, preData) {

    if (preData == null && preLabel == null) {

        console.log("Creating PIE chart from uploaded data")

        var localData = data.replace(/\(you\)/g, "")

        var rePersons = /(\d{2}\.\d{2}\.\d{4})\s(\d{2}\:\d{2}\:\d{2})\,\s(.+?):/g
        var foundMessages = localData.match(rePersons)
        var foundPersons = []

        messageStats.innerHTML = "The whole chat history contains " + foundMessages.length + " messages <br><br>"

        avgChart.unshift(foundMessages.length)

        for (message of foundMessages) {
            var rePersons = /(\d{2}\.\d{2}\.\d{4})\s(\d{2}\:\d{2}\:\d{2})\,\s(.+?):/g
            var tempFound = rePersons.exec(message)
            foundPersons.push(tempFound[3].replace(/[&<>"'/]/g, ""))  
        }

        //Check how often someone sent a message and reduce to an array with the persons and how many messages they wrote
        var personOccurences = foundPersons.reduce(function (acc, curr) {
            if (typeof acc[curr] == 'undefined') {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }

            return acc;
        }, {});

        var labels = []
        var tempData = []

        for (x in personOccurences) {
            labels.push(x)
            tempData.push(personOccurences[x])
        }


    } else {

        console.log("Creating PIE chart from DB data")

        tempData = preData
        labels = preLabel

    }




    if (chartInstance4 != null) {
        chartInstance4.destroy();
    }

    chartInstance4 = new Chart(chart4, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: tempData,
                backgroundColor: [
                    'rgba(245, 154, 53,0.8)',
                    'rgba(220,20,60, 0.8)',
                    'rgba(255,215,0, 0.8)',
                    'rgba(34,139,34, 0.8)',
                    'rgba(32,178,170, 0.8)',
                    'rgba(175,238,238, 0.8)',
                    'rgba(30,144,255, 0.8)',
                    'rgba(0,0,205, 0.8)',
                    'rgba(221,160,221, 0.8)',
                    'rgba(245,245,220, 0.8)',
                ]
            }],

            labels: labels
        },

        options: {

            maintainAspectRatio: maintainAspect,



            title: {
                display: true,
                text: 'Who sent how many messages',
                fontSize: chartFontSize
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        //get the concerned dataset
                        var dataset = data.datasets[tooltipItem.datasetIndex];
                        //calculate the total of this data set
                        var total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                            return previousValue + currentValue;
                        });
                        //get the current items value
                        var currentValue = dataset.data[tooltipItem.index];
                        //calculate the precentage based on the total and current item, also this does a rough rounding to give a whole number
                        var precentage = Math.floor(((currentValue / total) * 100) + 0.5);

                        return precentage + "%, " + currentValue + " messages";
                    }
                }
            }

        }

    });


}

var foundHeart;

function createHeartsChart(hearts) {

    console.log("Creating heart chart")

    if (hearts != null) {
        document.getElementById("heartText").innerHTML = "❤ sent: " + hearts.replace(/[&<>"'/]/g, "")
        return;

    }

    var reHeart = /❤/g;
    try {
        foundHeart = data.match(reHeart).length;
    } catch (error) {
        foundHeart = 0;
    }
    

    document.getElementById("heartText").innerHTML = "❤ sent: " + foundHeart


}

function createAllMessagesCharts(preData, preLabel, preData2, preLabel2) {

    if (preData == null || preLabel == null || preData2 == null || preLabel2 == null) {

        console.log("Creating chart with occurences of all messages")

        var occurences = []
        var labels = []

        var reDates = /(\d{2}\.\d{2}\.\d{4})\s(\d{2}\:\d{2}\:\d{2})\,/g;
        var foundDates = data.match(reDates);

        

        var justDays = []

        var foundDatesForWeekdaysChart = []

        for (var x = 0; x < foundDates.length; x++) {

            //The regex is in here because due to the "/g" it matches globally. Setting it outside would lead to it returning null every second loop
            var reDate = /(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\:(\d{2})\:(\d{2})\,/g;
            var tempFound = reDate.exec(foundDates[x])
            if (tempFound != null) {

                var newDate = new Date(tempFound[3], tempFound[2]-1, tempFound[1]);
                foundDatesForWeekdaysChart.push(new Date(tempFound[3], tempFound[2]-1, tempFound[1],tempFound[4],tempFound[5],tempFound[6]))

                justDays.push(newDate);

            }
        }

        createWeekdayChart(foundDatesForWeekdaysChart)

        //Check how many messages are sent on a day and reduce that array to one day each with the number of messages on that day
        var dayOccurences = justDays.reduce(function (acc, curr) {
            if (typeof acc[curr] == 'undefined') {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }

            return acc;
        }, {});


        var onlyDayNames = []
        var onlyMonths = []


        for (var key in dayOccurences) {



            if (dayOccurences.hasOwnProperty(key)) {

                var convDate = new Date(key)
                convDate.setDate(convDate.getDate());

                var monthNormalized = parseInt(convDate.getMonth()) + 1

                labels.push(convDate.getDate() + "." + monthNormalized.toString() + "." + convDate.getFullYear())
                occurences.push(dayOccurences[key])

                var tempMonth = convDate.getMonth() + 1  + "." + convDate.getFullYear()

                for (var x = 0; x < onlyMonths.length + 1; x++) {

                    if (!onlyMonths.length > 0) {
                        onlyMonths.push({ month: tempMonth, occurence: dayOccurences[key] })
                        break;
                    }

                    if (onlyMonths[x].month === tempMonth) {
                        onlyMonths[x].occurence += dayOccurences[key]
                        break;
                    }

                    if (x == onlyMonths.length - 1) {

                        onlyMonths.push({ month: tempMonth, occurence: dayOccurences[key] })
                    }

                }


            }
        }

        var monthsOccurences = []
        var monthLabels = []

        for (el of onlyMonths) {

            monthsOccurences.push(el.occurence)
            monthLabels.push(el.month)

        }

    }

    else {

        console.log("Creating chart with occurences of all messages from DB data")

        occurences = preData
        labels = preLabel

        monthsOccurences = preData2
        monthLabels = preLabel2

        //maintainAspect = true;
    }






    //Checking if chart1 already exists and destroys it
    if (chartInstance1 != null) {
        chartInstance1.destroy();
    }


    //initializing chart1
    chartInstance1 = new Chart(chart1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{

                data: occurences,
                backgroundColor: [
                    'rgba(54, 166, 241, 0.6)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(0,0,0,0.6)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {

            maintainAspectRatio: maintainAspect,

            scales: {
                xAxes: [{
                    time: {
                        unit: 'day'
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            title: {
                display: true,
                text: 'Messages over all days',
                fontSize: chartFontSize
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    chartInstance1.update();


    //Checking if chart2 already exists and destroys it
    if (chartInstance2 != null) {
        chartInstance2.destroy();
    }

    //initializing chart2
    chartInstance2 = new Chart(chart2, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{

                data: monthsOccurences,
                backgroundColor: [
                    'rgba(54, 166, 241, 0.6)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(0,0,0,0.6)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {

            maintainAspectRatio: maintainAspect,

            scales: {
                xAxes: [{
                    time: {
                        unit: 'day'
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            title: {
                display: true,
                text: 'Messages over all months',
                fontSize: chartFontSize
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });






}


//Functions to interact with the chart

function displayChart(chartName) {
    console.log("Showing charts")
    var chartDisplay = document.getElementsByClassName(chartName)
    for (chart of chartDisplay) {
        chart.style.display = "block"
    }
}


function removeAllData(chart) {
    chart.data.labels = []
    chart.data.datasets.forEach((dataset) => {
        dataset.data = []
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

//Collects data and info of all charts and combines them to base64 encoded data that it populated into the share code field
function generateShareCode() {

    var heartNumber = foundHeart;

    var pieChartLabel = chartInstance4.data.labels
    var pieChartData = chartInstance4.data.datasets[0].data

    var allDaysChartLabel = chartInstance1.data.labels
    var allDaysChartData = chartInstance1.data.datasets[0].data

    var monthsChartLabel = chartInstance2.data.labels
    var monthsChartData = chartInstance2.data.datasets[0].data

    var weekdayChartLabel = chartInstance5.data.labels
    var weekdayChartData = chartInstance5.data.datasets[0].data

    var hourChartLabel = chartInstance6.data.labels
    var hourChartData = chartInstance6.data.datasets[0].data

    //console.log("EmojiChartData: " + emojiChartData)


    dataObject = encodeURIComponent(JSON.stringify({
        avgChart: avgChart, pieChartLabel: pieChartLabel, pieChartData: pieChartData, allDaysChartData: allDaysChartData, allDaysChartLabel: allDaysChartLabel,
        monthsChartLabel: monthsChartLabel, monthsChartData: monthsChartData, weekdayChartLabel: weekdayChartLabel, weekdayChartData: weekdayChartData, heartNumber: heartNumber,
        emojiChartData: emojiChartData, hourChartLabel: hourChartLabel, hourChartData: hourChartData
    }))

    //console.log("Create data object: " + dataObject)

}

