

function handleFilterChange(){

    const filterType = document.getElementById('filterType')
    const customDateRange = document.getElementById('customDateRange')
   
    let filterValue = filterType.value
    localStorage.setItem('filterType',filterValue) 

    if(filterType.value === 'custom'){
        filterType.style.display = 'none'
        customDateRange.style.display = 'block'
    }else{
      window.location.href = `/admin/salesManagment?sort=${filterValue}`
    }
      
}


function generateCustomReport(){
      startDate = document.getElementById('startDate').value
      endDate = document.getElementById('endDate').value

      startErr = document.getElementById('start-date-err')
      endErr = document.getElementById('end-date-err')

      //clear previous errors
      startErr.classList.add('d-none')
      endErr.classList.add('d-none')

      if(startDate === ''){
        startErr.classList.remove('d-none')
        return
      }  

      if(endDate === ''){
        endErr.classList.remove('d-none')
        endErr.textContent = 'please select a end date'
        return
      }

      if(endDate < startDate){
        endErr.classList.remove('d-none')
        endErr.textContent = 'end date should be greater than start date'
        return
      }

      if(new Date(endDate) > new Date()){
        endErr.classList.remove('d-none')
        endErr.textContent = 'end should be present or past'
        return
      }

      window.location.href = `/admin/salesManagment?sort=custom&startDate=${startDate}&endDate=${endDate}`

}

function downloadSalesReport(format){
  
  const filterType = localStorage.getItem('filterType')
  const startDate = document.getElementById('startDate').value
  const endDate = document.getElementById('endDate').value

  let url
  if(filterType === 'custom'){
    url = `/admin/salesReportDownload?format=${format}&filterType=${filterType}&startDate=${startDate}&endDate=${endDate}`
  }else{
    url = `/admin/salesReportDownload?format=${format}&filterType=${filterType}`
  }

  localStorage.removeItem('filterType');

  window.open(url, '_blank');
  
}