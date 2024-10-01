
// const chartFilter =  JSON.stringify(chartFilter)
// console.log('charfilter',chartFilter)

const chartFilter = chartFilterG

const ctx = document.getElementById('barChart').getContext('2d');

  //  function updateChart(data){
  //     if (window.myChart instanceof Chart) {
  //       window.myChart.destroy();
  //     }

     let barChart = null
     function updateChart(chartData){

      if(barChart){
        barChart.destroy()
      }

       barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.labels, // Replace with your product names
          datasets: [{
            label: chartData.datasets[0].label,
            data: chartData.datasets[0].data, // Replace with your data values
            backgroundColor: 'rgb(229, 54, 55)',
            borderWidth: 1,
            borderRadius: 10,
            barThickness: 30,
            hoverBackgroundColor: 'rgba(255, 99, 132, 0.9)', 
          }]
        },
        options: {
          scales: {
              x: {
                  grid: {
                      display: false  
                  }
              },
              y: {
                  grid: {
                      display: false  
                  },
                  beginAtZero: true
              }
          },
          
        }
      });
     }
      
     updateChart(chartFilter)

    function handleChartFilterChange() {
      try {
          const filterType = document.getElementById('chartFilterType').value;
          console.log('filter type', filterType);
          fetch(`/admin/dashboard?filterType=${filterType}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            // Note the change here
            updateChart(data.chartFilter)
        })
        .catch(error => console.error('Error fetching data:', error));
    }  catch (error) {
          console.error('something went wrong', error);
      }
  }

    // function selectedOptionFromQuery(){
    //   const urlParams = new URLSearchParams(window.location.search)
    //   const filterType = urlParams.get('filterType')
    //   if(filterType){
    //     const selectedElement = document.getElementById('chartFilterType')
    //     selectedElement.value = filterType
    //   }
    // }

    // window.onload = selectedOptionFromQuery()