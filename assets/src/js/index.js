var App = function () {
	
	var reportDays = 7,
		reportProject = null;

	//get API token passing by query string
	var APIToken = (location.href.match(/[\?\&]token\=(.+?)(\&|$)/)||['',''])[1]
	
	var baseURL = '/ajax/report',
		getBaseReportDataURL = () => `${baseURL}/recent?days=${reportDays}&token=${APIToken}`,
		getLast24HoursDataURL = (now) => `${baseURL}/last24hs?ts=${now}&token=${APIToken}`;
		// getProjectReportDataURL = () => `${baseURL}/project?project=${reportProject}&days=${reportDays}&token=${APIToken}`;

	var loadStatus = new LoadStatus($('#statusDialog')),
		$reportDateRange = $('#selectReportDateRange');	
	var charts = new Charts();
	
	$reportDateRange.on('change', startAjaxGetBaseReportData);
	
	
	startAjaxGetBaseReportData();
	startAjaxGetLast24HoursData();

	function startAjaxGetBaseReportData() {
		reportDays = Number($reportDateRange.val());

		loadStatus.showLoading();
		$.ajax({
			method: 'GET',
			url: getBaseReportDataURL(),
			success: data => handlerBaseReportData(data),
			error: data => loadStatus.showFailed(data)
		});
	}
	
	function startAjaxGetLast24HoursData() {
		var now = Date.now();
		$.ajax({
			method: 'GET',
			url: getLast24HoursDataURL(now),
			success: data => handler(data),
			error: data => loadStatus.showFailed(data)			
		})

		function handler(data) {
			charts.setLast24HsData(Utils.expandAndShortGroupByHoursObject(data.groupBy.hour, now));
			//last 24 hours counter
			var totalData = Utils.convertGroupByDataUnit2Hour({ total: data.total }).total;
			$('#counterLast24Hs').html(`total: watching time: <b>${totalData.watching}</b> hs. coding time: <b>${totalData.coding}</b> hs`);

		}	
	}

	
	function handlerBaseReportData(data) {

		if (data.error)
			return loadStatus.showFailed($.extend(true, data, {
				tip: 'You can visit private report page by passing token like this: ' +
					'`http://domain:port/report/?token=${YOUR TOKEN}`' }));

		//-----------show summary chart--------
		var today = new Date();
		var startDate = new Date(today);
		startDate.setDate(startDate.getDate() - reportDays + 1);
		var groupByDayData = $.extend(true, {}, data.groupBy.day);
		var data1 = Utils.expandGroupByDaysObject(groupByDayData, startDate, today);
		charts.setSummaryData(data1);
		
		//summary counter
		var totalData = Utils.convertGroupByDataUnit2Hour({ total: data.total }).total;
		$('#counterSummary').html(`total: watching time: <b>${totalData.watching}</b> hs. coding time: <b>${totalData.coding}</b> hs`);

		//-------------------------------------
		
		//-----------computer chart------------
		charts.setComputerData(data.groupBy.computer);
		//-------------------------------------
		charts.setLanguageData(data.groupBy.language);

		charts.setProjectData(data.groupBy.project);

		charts.setFileData(data.groupBy.file);
		
		loadStatus.hide();
	}
};
var app = new App();