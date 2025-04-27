@extends('admin.layouts.app')

<x-assets.datatables />

@push('page-css')
    <link rel="stylesheet" href="{{asset('assets/plugins/chart.js/Chart.min.css')}}">
@endpush

@push('page-header')
<div class="col-sm-12">
	<h3 class="page-title">Welcome {{auth()->user()->name}}!</h3>
	<ul class="breadcrumb">
		<li class="breadcrumb-item active">Dashboard</li>
	</ul>
</div>
@endpush

@section('content')
{{-- Top Summary Cards --}}
<div class="row">
    <div class="col-xl-3 col-sm-6 col-12">
        <div class="card">
            <div class="card-body">
                <div class="dash-widget-header">
                    <span class="dash-widget-icon text-success border-success">
                        <i class="fe fe-money"></i>
                    </span>
                    <div class="dash-count">
                        <h3>{{-- {{AppSettings::get('app_currency', '$')}} {{$today_sales}} --}}
                            {{ $today_sales_formatted }} {{-- Gunakan variabel yang sudah diformat --}}
                        </h3>
                    </div>
                </div>
                <div class="dash-widget-info">
                    <h6 class="text-muted">Today's Sales</h6>
                    <!-- <div class="progress progress-sm">
                        <div class="progress-bar bg-success w-50"></div>
                    </div> -->
                </div>
            </div>
        </div>
    </div><!-- Visit codeastro.com for more projects -->
    <div class="col-xl-3 col-sm-6 col-12">
        <div class="card">
            <div class="card-body">
                <div class="dash-widget-header">
                    <span class="dash-widget-icon text-info">
                        <i class="fa fa-th-large"></i>
                    </span>
                    <div class="dash-count">
                        <h3>{{$total_categories}}</h3>
                    </div>
                </div>
                <div class="dash-widget-info">
                    
                    <h6 class="text-muted">Available Categories</h6>
                    <!-- <div class="progress progress-sm">
                        <div class="progress-bar bg-info w-50"></div>
                    </div> -->
                </div><!-- Visit codeastro.com for more projects -->
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-sm-6 col-12">
        <div class="card">
            <div class="card-body">
                <div class="dash-widget-header">
                    <span class="dash-widget-icon text-danger border-danger">
                        <i class="fe fe-folder"></i>
                    </span>
                    <div class="dash-count">
                        <h3>{{$total_expired_products}}</h3>
                    </div>
                </div>
                <div class="dash-widget-info">
                    
                    <h6 class="text-muted">Expired Medicines</h6>
                    <!-- <div class="progress progress-sm">
                        <div class="progress-bar bg-danger w-50"></div>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-sm-6 col-12">
        <div class="card">
            <div class="card-body">
                <div class="dash-widget-header">
                    <span class="dash-widget-icon text-warning border-warning">
                        <i class="fe fe-users"></i>
                    </span>
                    <div class="dash-count">
                        <h3>{{\DB::table('users')->count()}}</h3>
                    </div>
                </div>
                <div class="dash-widget-info">
                    
                    <h6 class="text-muted">System Users</h6>
                    <!-- <div class="progress progress-sm">
                        <div class="progress-bar bg-warning w-50"></div>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</div><!-- Visit codeastro.com for more projects -->

{{-- Main Row: Sales Table, Pie Chart, and New Monthly Chart --}}
<div class="row">
    {{-- Recent Sales Table --}}
    <div class="col-md-12 col-lg-7">
        <div class="card card-table p-3">
            <div class="card-header">
                <h4 class="card-title ">Recent Sales List</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="sales-table" class="datatable table table-hover table-center mb-0">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{-- Data loaded by datatables --}}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div><!-- Visit codeastro.com for more projects -->

    {{-- Right Column: Pie Chart and Monthly Sales --}}
    <div class="col-md-12 col-lg-5">

        <!-- Pie Chart -->
        <div class="card card-chart">
            <div class="card-header">
                <h4 class="card-title text-center">Overview Report</h4>
            </div>
            <div class="card-body">
                <div style="">
                    {!! $pieChart->render() !!}
                </div>
            </div>
        </div>
        <!-- /Pie Chart -->

        <!-- Monthly Sales Chart -->
        <div class="card card-chart">
            <div class="card-header">
                <h4 class="card-title text-center">Monthly Sales Report</h4>
            </div>
            <div class="card-body">
                <canvas id="monthlySalesChart"></canvas>
            </div>
        </div>
        <!-- /Monthly Sales Chart -->

    </div>


</div>

@endsection

@push('page-js')
{{-- Include Chart.js library --}}
<script src="{{asset('assets/plugins/chart.js/Chart.bundle.min.js')}}"></script>

{{-- Datatables Script for Recent Sales --}}
<script>
    $(document).ready(function() {
        var table = $('#sales-table').DataTable({
            processing: true,
            serverSide: true,
            ajax: "{{route('sales.index')}}", // Check if this route exists and returns correct data
            columns: [
                {data: 'product', name: 'product'},
                {data: 'quantity', name: 'quantity'},
                {data: 'total_price', name: 'total_price'},
                {data: 'date', name: 'date'},
            ]
        });
    });
</script>

{{-- Script for Monthly Sales Chart --}}
<script>
    var ctxMonthly = document.getElementById('monthlySalesChart').getContext('2d');
    var monthlySalesChart = new Chart(ctxMonthly, {
        type: 'line', // or 'bar'
        data: {
            labels: @json($monthlyLabels),
            datasets: [{
                label: 'Total Sales',
                data: @json($monthlyData),
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // Blue area
                borderColor: 'rgba(54, 162, 235, 1)', // Blue line
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value, index, values) {
                            // Format Y-axis labels as currency if needed
                            return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        }
                    }
                }]
            },
            tooltips: {
                 callbacks: {
                    label: function(tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += 'Rp ' + tooltipItem.yLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        return label;
                    }
                }
            }
        }
    });
</script>
@endpush