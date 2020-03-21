let gData;
let gRegions = [];

const LANG = $("html").attr("lang");
const REGION_THRESHOLD = 10;
const COLORS = {
  default: "#3DC",
  dark: "#399",
  patient: "#ED9",
  discharge: "#3CA",
  test: "#3DC",
  dead: "#E95",
  positive: "#E95",
  selected: "#EC2",
  gender: {
    f: "#FE9",
    m: "#2B9"
  }
};
const LABELS = {
  ja: {
    chart: {
      patients: {
        dead: "死亡数",
        discharge: "退院数",
        patient: "患者数"
      },
      surveys: {
        patient: "有症数",
        positive: "陽性者数",
        test: "検査数"
      },
      demography: {
        f: "女性",
        m: "男性"
      }
    },
    age: {
      "10代": "10代",
      "20代": "20代",
      "30代": "30代",
      "40代": "40代",
      "50代": "50代",
      "60代": "60代",
      "70代": "70代",
      "80代": "80代",
      "90代": "90代",
      "10歳未満": "10歳未満"
    }
  },
  en: {
    chart: {
      patients: {
        dead: "Deaths",
        discharge: "Discharged",
        patient: "Cases"
      },
      surveys: {
        patient: "Cases",
        positive: "Positive",
        test: "PCR Tests"
      },
      demography: {
        f: "Female",
        m: "Male"
      }
    },
    age: {
      "10代": "10s",
      "20代": "20s",
      "30代": "30s",
      "40代": "40s",
      "50代": "50s",
      "60代": "60s",
      "70代": "70s",
      "80代": "80s",
      "90代": "90s",
      "10歳未満": "Under 10"
    }
  }
};

const STOPCOVID_URLS= {
  "北海道": "https://stopcovid19.hokkaido.dev/",
  "青森県": "",
  "岩手県": "",
  "宮城県": "",
  "秋田県": "",
  "山形県": "",
  "福島県": "",
  "茨城県": "",
  "栃木県": "",
  "群馬県": "https://covid19-gunma.com/",
  "埼玉県": "https://stopcovid19.e-toda.jp/",
  "千葉県": "https://chiba-covid19.mypl.net/",
  "東京都": "https://stopcovid19.metro.tokyo.lg.jp/about",
  "神奈川県": "https://www.pref.kanagawa.jp/osirase/1369/",
  "新潟県": "",
  "富山県": "",
  "石川県": "",
  "福井県": "",
  "山梨県": "https://stopcovid19.yamanashi.dev/",
  "長野県": "https://stop-covid19-nagano.netlify.com/",
  "岐阜県": "https://covid19-gifu.netlify.com/",
  "静岡県": "",
  "愛知県": "https://stopcovid19.code4.nagoya/",
  "三重県": "https://covid19-mie.netlify.com/",
  "滋賀県": "",
  "京都府": "",
  "大阪府": "https://covid19-osaka.info/",
  "兵庫県": "https://stop-covid19-hyogo.org/",
  "奈良県": "https://stopcovid19.code4nara.org/",
  "和歌山県": "",
  "鳥取県": "",
  "島根県": "",
  "岡山県": "https://okayama.stopcovid19.jp/",
  "広島県": "",
  "山口県": "https://yamaguchi.stopcovid19.jp/",
  "徳島県": "",
  "香川県": "https://covid19-kagawa.netlify.com/",
  "愛媛県": "https://ehime-covid19.com/",
  "高知県": "https://covid19-kochi.netlify.com/",
  "福岡県": "",
  "佐賀県": "",
  "長崎県": "",
  "熊本県": "",
  "大分県": "",
  "宮崎県": "",
  "鹿児島県": "https://covid19.codeforkagoshima.dev/",
  "沖縄県": ""
};

const init = () => {
  const drawPatientsChart = () => {
    let $wrapper = $("#patients-chart");
    $wrapper.empty();
    $wrapper.html("<canvas></canvas>");
    let $canvas = $wrapper.find("canvas")[0];

    let switchValue = $("#patients-block").find(".switch.selected").attr("value");
    let isStacked = (switchValue === "total") ? true: false;

    let config = {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: LABELS[LANG].chart.patients.dead,
          backgroundColor: COLORS.dead,
          borderColor: COLORS.dead,
          data: []
        },{
          label: LABELS[LANG].chart.patients.discharge,
          backgroundColor: COLORS.discharge,
          borderColor: COLORS.discharge,
          data: []
        },{
          label: LABELS[LANG].chart.patients.patient,
          backgroundColor: COLORS.patient,
          borderColor: COLORS.patient,
          data: []
        }]
      },
      options: {
        aspectRatio: 1.2,
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontColor: "rgba(255, 255, 255, 0.7)"
          }
        },
        title: {
          display: false
        },
        tooltips: {
          xPadding: 24,
          yPadding: 12,
          displayColors: false,
          callbacks: {
            title: function(tooltipItem){
              let prefix = {
                ja: "",
                en: "As of "
              };

              let dateTime = tooltipItem[0].xLabel + " " + gData.transition[tooltipItem[0].index][2] + ":00";

              let suffix = {
                ja: {
                  total: "時点 累計",
                  new: "時点新規"
                },
                en: {
                  total: " Total",
                  new: " New cases"
                }
              };

              return prefix[LANG] + dateTime + suffix[LANG][switchValue];
            },
            label: function(tooltipItem, data){
              let row = gData.transition[tooltipItem.index];
              let ret;
              let suffix = {
                ja: "名",
                en: ""
              };

              if (switchValue === "new" && tooltipItem.index >= 1) {
                const prev = gData.transition[tooltipItem.index - 1];
                ret = [
                  LABELS[LANG].chart.patients.patient   + ": " + (row[5] - prev[5]) + suffix[LANG],
                  LABELS[LANG].chart.patients.discharge + ": " + (row[6] - prev[6]) + suffix[LANG],
                  LABELS[LANG].chart.patients.dead      + ": " + (row[7] - prev[7]) + suffix[LANG]
                ];
              } else {
                ret = [
                  LABELS[LANG].chart.patients.patient   + ": " + row[5] + suffix[LANG],
                  LABELS[LANG].chart.patients.discharge + ": " + row[6] + suffix[LANG],
                  LABELS[LANG].chart.patients.dead      + ": " + row[7] + suffix[LANG]
                ];
              }
              return ret;
            }
          }
        },
        scales: {
          xAxes: [{
            stacked: isStacked,
            gridLines: {
              display: false
            },
            ticks: {
              fontColor: "rgba(255,255,255,0.7)"
            }
          }],
          yAxes: [{
            location: "bottom",
            stacked: false,
            gridLines: {
              display: true,
              zeroLineColor: "rgba(255,255,255,0.7)",
              color: "rgba(255, 255, 255, 0.3)"
            },
            ticks: {
              beginAtZero: true,
              fontColor: "rgba(255,255,255,0.7)",
              callback: function(value, index, values) {
                return value.toString();
              }
            }
          }]
        }
      }
    };

    if (switchValue === "new") {
      config.type = "line";
      config.data.datasets.forEach(function(dataset){
        dataset.fill = false;
        dataset.lineTension = 0.1;
        dataset.pointBackgroundColor = "#242a3c";
        dataset.pointBorderWidth = 1.5;
        dataset.pointRadius = 2.5;
        dataset.borderWidth = 4;
      });
    }

    if ($wrapper.width() >= 400) config.options.aspectRatio = 1.5;
    if ($wrapper.width() >= 600) config.options.aspectRatio = 1.8;

    gData.transition.forEach(function(date, i){
      config.data.labels.push(date[0] + "/" + date[1]);

      if (switchValue === "new" && i >= 1) {
        let prev = gData.transition[i - 1];
        config.data.datasets[2].data.push(date[5] - prev[5]);
        config.data.datasets[1].data.push(date[6] - prev[6]);
        config.data.datasets[0].data.push(date[7] - prev[7]);
      } else {
        config.data.datasets[2].data.push(date[5]);
        config.data.datasets[1].data.push(date[6]);
        config.data.datasets[0].data.push(date[7]);
      }
    });

    let ctx = $canvas.getContext('2d');
    window.myChart = new Chart(ctx, config);
  }

  const drawSurveysChart = () => {
    let $wrapper = $("#surveys-chart");
    $wrapper.empty();
    $wrapper.html("<canvas></canvas>");
    let $canvas = $wrapper.find("canvas")[0];

    let switchValue = $("#surveys-block").find(".switch.selected").attr("value");
    let isStacked = (switchValue === "total") ? true: false;

    let config = {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: LABELS[LANG].chart.surveys.patient,
          backgroundColor: [],
          borderColor: COLORS.patient,
          data: []
        },{
          label: LABELS[LANG].chart.surveys.positive,
          backgroundColor: [],
          borderColor: COLORS.positive,
          data: []
        },{
          label: LABELS[LANG].chart.surveys.test,
          backgroundColor: [],
          borderColor: COLORS.test,
          data: []
        }]
      },
      options: {
        aspectRatio: 1.2,
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontColor: "rgba(255, 255, 255, 0.7)"
          }
        },
        title: {
          display: false
        },
        tooltips: {
          xPadding: 24,
          yPadding: 12,
          displayColors: false,
          callbacks: {
            title: function(tooltipItem){
              let prefix = {
                ja: "",
                en: "As of "
              };

              let dateTime = tooltipItem[0].xLabel + " " + gData.transition[tooltipItem[0].index][2] + ":00";

              let suffix = {
                ja: {
                  total: "時点 累計",
                  new: "時点新規"
                },
                en: {
                  total: " Total",
                  new: " New cases"
                }
              };

              return prefix[LANG] + dateTime + suffix[LANG][switchValue];
            },
            label: function(tooltipItem, data){
              let row = gData.transition[tooltipItem.index];
              let ret;
              let suffix = {
                ja: "名",
                en: ""
              };

              if (switchValue === "new" && tooltipItem.index >= 1) {
                const prev = gData.transition[tooltipItem.index - 1];
                if (prev[3] !== "") {
                  ret = [
                    LABELS[LANG].chart.surveys.test     + ": " + (row[3] - prev[3]) + suffix[LANG],
                    LABELS[LANG].chart.surveys.positive + ": " + (row[4] - prev[4]) + suffix[LANG],
                    LABELS[LANG].chart.surveys.patient  + ": " + (row[5] - prev[5]) + suffix[LANG]
                  ];
                }
              } else {
                ret = [
                  LABELS[LANG].chart.surveys.test     + ": " + row[3] + suffix[LANG],
                  LABELS[LANG].chart.surveys.positive + ": " + row[4] + suffix[LANG],
                  LABELS[LANG].chart.surveys.patient  + ": " + row[5] + suffix[LANG]
                ];
              }
              return ret;
            }
          }
        },
        scales: {
          xAxes: [{
            stacked: isStacked,
            gridLines: {
              display: false
            },
            ticks: {
              fontColor: "rgba(255,255,255,0.7)"
            }
          }],
          yAxes: [{
            location: "bottom",
            stacked: false,
            gridLines: {
              display: true,
              zeroLineColor: "rgba(255,255,255,0.7)",
              color: "rgba(255, 255, 255, 0.3)"
            },
            ticks: {
              suggestedMin: 0,
              fontColor: "rgba(255,255,255,0.7)",
              callback: function(value, index, values) {
                return value.toString();
              }
            }
          }]
        }
      }
    };

    if (switchValue === "new") {
      config.type = "line";
      config.data.datasets.forEach(function(dataset){
        dataset.fill = false;
        dataset.lineTension = 0.1;
        dataset.pointBackgroundColor = "#242a3c";
        dataset.pointBorderWidth = 1.5;
        dataset.pointRadius = 2.5;
        dataset.borderWidth = 4;
      });
    }

    if ($wrapper.width() >= 400) config.options.aspectRatio = 1.5;
    if ($wrapper.width() >= 600) config.options.aspectRatio = 1.8;

    gData.transition.forEach(function(date, i){
      config.data.labels.push(date[0] + "/" + date[1]);

      if (switchValue === "new" && i >= 1) {
        let prev = gData.transition[i - 1];
        config.data.datasets[2].data.push(date[3] - prev[3]);
        config.data.datasets[1].data.push(date[4] - prev[4]);
        config.data.datasets[0].data.push(date[5] - prev[5]);
      } else {
        config.data.datasets[2].data.push(date[3]);
        config.data.datasets[1].data.push(date[4]);
        config.data.datasets[0].data.push(date[5]);
      }

      let pcrTestColor = (date[0] >= 3 && date[1] >= 4) ? COLORS.dark: COLORS.test;

      config.data.datasets[2].backgroundColor.push(pcrTestColor);
      config.data.datasets[1].backgroundColor.push(COLORS.positive);
      config.data.datasets[0].backgroundColor.push(COLORS.patient);
    });

    let ctx = $canvas.getContext('2d');
    window.myChart = new Chart(ctx, config);
  }

  const getPrefColor = (value) => {
    let ret = "rgba(90, 90, 90, 0.3)";
    if (value >= 1)  ret = COLORS.dark;
    if (value >= REGION_THRESHOLD) ret = COLORS.default;
    return ret;
  }

  const drawJapanMap = () => {
    const WIDTH = $("#japan-map").width();

    let prefs = [];
    gData.prefectures.forEach(function(pref, i){
      prefs.push({
        code: pref.code,
        jp: pref.jp,
        en: pref.en,
        color: getPrefColor(pref.value),
        hoverColor: COLORS.selected,
        prefectures: [pref.code]
      });
    });

    $("#japan-map").japanMap({
      areas: prefs,
      width: WIDTH,
      borderLineColor: "#fcfcfc",
      borderLineWidth : 0.25,
      lineColor : "#ccc",
      lineWidth: 1,
      drawsBoxLine: false,
      showsPrefectureName: false,
      movesIslands : true,
      fontSize : 11,
      onHover : function(data){
        if (STOPCOVID_URLS[data.name] !== "") {
          // 都道府県の新型コロナウイルス対策サイトが存在する場合はアイコンを表示させる。
          $("#info_cursor").css("display", "block");
        } else {
          $("#info_cursor").css("display", "none");
        }
        drawRegionChart(data.code, 0);
      },
      onSelect : function(data){
        // 地図クリック時に各都道府県の新型コロナウイルス対策サイトを開く。
        if (STOPCOVID_URLS[data.name] !== "") {
          window.open(STOPCOVID_URLS[data.name]);
          $("#info_cursor").css("display", "none");  // アイコンが残ったままになるので非表示にする。
        }
      }
    });
    $("#japan-map").mousemove(function(event){
      // アイコンとして使用するDIV要素をマウスカーソルの位置に配置する。
      // マウスカーソルの右下にアイコンを表示させるようx,yを+10する。
      $("#info_cursor").offset({top: event.pageY+10, left: event.pageX+10});
      if ($("#japan-map").children("canvas").css("cursor") === "default"){
        // マウスカーソルが地図の外に出たらアイコンを非表示にする。
        $("#info_cursor").css("display", "none");
      }
    });
  }

  const drawDemographyChart = () => {
    $wrapper = $("#demography-chart");
    $wrapper.empty();
    $wrapper.html('<canvas></canvas>');
    $canvas = $wrapper.find("canvas")[0];

    let config = {
      type: "horizontalBar",
      data: {
        labels: [],
        datasets: [{
          label: LABELS[LANG].chart.demography.f,
          backgroundColor: COLORS.gender.f,
          data: []
        },{
          label: LABELS[LANG].chart.demography.m,
          backgroundColor: COLORS.gender.m,
          data: []
        }]
      },
      options: {
        aspectRatio: 0.9,
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontColor: "rgba(255, 255, 255, 0.7)"
          }
        },
        title: {
          display: false
        },
        tooltips: {
          xPadding: 24,
          yPadding: 12,
          displayColors: true,
          callbacks: {
            title: function(tooltipItem){
              return tooltipItem[0].yLabel;
            },
            label: function(tooltipItem, data){
              let suffix = {
                ja: "名",
                en: ""
              };
              return data.datasets[tooltipItem.datasetIndex].label + ": " + tooltipItem.value + suffix[LANG];
            }
          }
        },
        scales: {
          xAxes: [{
            position: "top",
            color: "yellow",
            gridLines: {
              color: "rgba(255,255,255,0.2)"
            },
            ticks: {
              suggestedMin: 0,
              fontColor: "rgba(255,255,255,0.7)",
              callback: function(value, index, values) {
                return value.toString();
              }
            }
          }],
          yAxes: [{
            gridLines: {
              color: "rgba(255,255,255,0.1)"
            },
            ticks: {
              fontColor: "rgba(255,255,255,0.7)",
              callback: function (value){
                return LABELS[LANG].age[value];
              }
            }
          }]
        }
      }
    };

    if ($wrapper.outerWidth() >= 400) config.options.aspectRatio = 1.1;
    if ($wrapper.outerWidth() >= 600) config.options.aspectRatio = 1.3;

    let dsi = 0;
    for (let gender in gData.demography) {
      for (let age in gData.demography[gender]) {
        let value = gData.demography[gender][age];
        if (dsi === 0) config.data.labels.push(age);
        config.data.datasets[dsi].data.push(value);
      }
      dsi++;
    }

    let ctx = $canvas.getContext('2d');
    window.myChart = new Chart(ctx, config);
  }

  const drawRegionChart = (targetRegion) => {
    let $wrapper = $("#region-chart");
    $wrapper.empty();
    $wrapper.html('<canvas></canvas>');
    let $canvas = $wrapper.find("canvas")[0];

    let config = {
      type: "horizontalBar",
      data: {
        labels: [],
        datasets: [{
          label: "",
          backgroundColor: [],
          data: []
        }]
      },
      options: {
        aspectRatio: 0.6,
        animation: {
          duration: 1000
        },
        responsive: true,
        legend: {
          display: false
        },
        title: {
          display: false
        },
        tooltips: {
          xPadding: 24,
          yPadding: 12,
          displayColors: true,
          callbacks: {
            title: function(tooltipItem){
              return tooltipItem[0].yLabel;
            },
            label: function(tooltipItem, data){
              let suffix = {
                ja: " 名",
                en: " cases"
              };
              return tooltipItem.xLabel + suffix[LANG];
            }
          }
        },
        scales: {
          xAxes: [{
            position: "top",
            gridLines: {
              color: "rgba(255,255,255,0.2)"
            },
            ticks: {
              suggestedMin: 0,
              fontColor: "rgba(255,255,255,0.7)",
              callback: function(value, index, values) {
                return value.toString();
              }
            }
          }],
          yAxes: [{
            gridLines: {
              color: "rgba(255,255,255,0.1)"
            },
            ticks: {
              fontColor: "rgba(255,255,255,0.7)",
            }
          }]
        }
      }
    };

    if ($wrapper.outerWidth() >= 400) config.options.aspectRatio = 0.8;
    if ($wrapper.outerWidth() >= 600) config.options.aspectRatio = 1.0;
    if (targetRegion !== "") config.options.animation.duration = 0;

    gData.prefectures.forEach(function(pref, i){
      if (pref.value >= 1) {
        config.data.labels.push(pref[LANG]);
        config.data.datasets[0].data.push(pref.value);

        if (targetRegion === pref.code) {
          config.data.datasets[0].backgroundColor.push(COLORS.selected);
        } else {
          config.data.datasets[0].backgroundColor.push(getPrefColor(pref.value));
        }
      }
    });

    let ctx = $canvas.getContext('2d');
    window.myChart = new Chart(ctx, config);
  }

  const showUpdateDates = () => {
    ["last", "transition", "demography", "prefectures"].forEach(function(cls){
      $(".updated-" + cls).text(gData.updated[cls][LANG]);
    });
  }

  const loadData = () => {
    $.getJSON("https://raw.githubusercontent.com/kaz-ogiwara/covid19/master/data/data.json", function(data){
      gData = data;
      drawSurveysChart();
      drawPatientsChart();
      drawDemographyChart();
      drawJapanMap();
      drawRegionChart("");
      showUpdateDates();
      $("#container").addClass("show");
    })
  }

  const bindEvents = () => {
    $(".switch").on("click",function(){
      $(this).siblings(".switch").removeClass("selected");
      $(this).addClass("selected");
      if ($(this).closest("#patients-block")[0]) drawPatientsChart();
      if ($(this).closest("#surveys-block")[0]) drawSurveysChart();
    });

  }

  loadData();
  bindEvents();
};


$(function(){
  init();
});
