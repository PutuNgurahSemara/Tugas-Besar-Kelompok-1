<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{ucfirst(AppSettings::get('app_name', 'App'))}} - {{ucfirst($title ?? '')}}</title>
    <!-- Favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="{{!empty(AppSettings::get('favicon')) ? asset('storage/'.AppSettings::get('favicon')) : asset('assets/img/favicon.png')}}">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="{{asset('assets/css/bootstrap.min.css')}}">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="{{asset('assets/plugins/fontawesome/css/fontawesome.min.css')}}">

    <!-- Main CSS -->
    <link rel="stylesheet" href="{{asset('assets/css/style.css')}}">
    <!-- Page CSS -->
    @stack('page-css')
    <!--[if lt IE 9]>
        <script src="assets/js/html5shiv.min.js"></script>
        <script src="assets/js/respond.min.js"></script>
    <![endif]-->
    <style>
        /* Override some styles for the new login page */
        .login-body {
            background-color: #eef2f6; /* Background abu-abu muda */
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .login-wrapper {
             width: 100%;
             max-width: 900px; /* Max width for the box */
             margin: auto;
        }
        .loginbox {
            display: flex;
            width: 100%;
            min-height: 550px; /* Adjust height as needed */
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-radius: 0.5rem; 
            overflow: hidden; /* Prevent content overflow */
            background-color: #fff; /* Default background */
        }
        .login-left {
            flex: 0 0 45%; /* Adjust width percentage */
            background-color: #28a745; /* Green background */
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        }
        .login-left .login-logo img {
            max-width: 100px; /* Adjust logo size */
            margin-bottom: 20px;
            /* Tambahkan filter invert(1) brightness(10) jika logo aslinya gelap agar jadi putih */
            /* filter: invert(1) brightness(10); */ 
        }
        .login-left h2 {
            font-weight: 600;
            margin-bottom: 10px;
        }
        .login-left p {
            font-size: 1rem;
            opacity: 0.9;
        }
        .login-right {
            flex: 0 0 55%; /* Adjust width percentage */
            background-color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }
        .login-right-wrap {
            width: 100%;
            max-width: 380px; /* Max width for the form area */
        }
        .login-right h1 {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 10px;
            text-align: center;
            color: #333;
        }
        .login-right .account-subtitle {
            color: #6c757d;
            font-size: 1rem;
            margin-bottom: 30px;
            text-align: center;
        }
        /* Ensure form controls have the rounded style */
        .login-right .form-control {
             border-radius: 0.35rem !important;
        }
        .login-right .btn-success {
             border-radius: 0.35rem !important;
             padding: 10px 15px;
             font-weight: 500;
        }
        .login-right .forgotpass a, .login-right .dont-have {
            font-size: 0.9rem;
        }
        .login-right .dont-have a {
             color: #28a745; /* Green link */
             font-weight: 500;
        }
    </style>
</head>
<body>

    <!-- Main Wrapper -->
    <div class="main-wrapper login-body">
        <div class="login-wrapper">
            <div class="loginbox">
                <div class="login-left">
                    <div class="login-logo">
                        {{-- Ganti dengan logo Anda atau gunakan placeholder --}}
                        <img src="{{ asset('assets/img/favicon.png') }}" alt="Logo Placeholder">
                    </div>
                    <h2>{{ AppSettings::get('app_name', 'Pharmacy App') }}</h2>
                    <p>Complete Pharmacy Management Solution</p>
                </div>
                <div class="login-right">
                    <div class="login-right-wrap">
                        <h1>Welcome Back</h1>
                        <p class="account-subtitle">Login to your account to continue</p>

                        @if ($errors->any())
                            @foreach ($errors->all() as $error)
                                <x-alerts.danger :error="$error" />
                            @endforeach
                        @endif
                        
                        @yield('content') {{-- Form login akan dirender di sini --}}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Main Wrapper -->
    
</body>
<!-- jQuery -->
<script src="{{asset('assets/js/jquery-3.2.1.min.js')}}"></script>

<!-- Bootstrap Core JS -->
<script src="{{asset('assets/js/popper.min.js')}}"></script>
<script src="{{asset('assets/js/bootstrap.min.js')}}"></script>

<!-- Custom JS -->
<script src="{{asset('assets/js/script.js')}}"></script>
<!-- Page JS -->
@stack('page-js')
</html>