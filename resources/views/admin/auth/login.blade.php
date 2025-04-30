@extends('admin.layouts.plain')

@section('content')
{{-- Hapus H1 dan P lama karena sudah ada di layout --}}
{{-- <h1>Pharmacy System</h1> --}}
{{-- <p class="account-subtitle">Login Panel</p> --}}

@if (session()->has('login_error') && !empty(session('login_error')))
<x-alerts.danger :error="session('login_error')" />
@endif
<!-- Form -->
<form action="{{route('login')}}" method="post">
	@csrf
	<div class="form-group">
		<input class="form-control" name="email" type="text" placeholder="Email">
	</div>
	<div class="form-group">
		<input class="form-control" name="password" type="password" placeholder="Password">
	</div>
    {{-- Tambahkan Remember Me jika diinginkan --}}
    <div class="form-group row">
        <div class="col">
            <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="remember_me" name="remember">
                <label class="custom-control-label" for="remember_me">Remember me</label>
            </div>
        </div>
        <div class="col-auto">
            <a class="text-muted" href="{{route('password.request')}}">
                Forgot password?
            </a>
        </div>
    </div>
	<div class="form-group">
		<button class="btn btn-success btn-block" type="submit">Sign in</button>
	</div>
</form>
<!-- /Form -->

<!-- Visit codeastro.com for more projects -->

{{-- Hapus link forgot password dan don't have account lama --}}
{{-- <div class="text-center forgotpass"><a href="{{route('password.request')}}">Forgot Password?</a></div> --}}
{{-- <div class="text-center dont-have">Don't have an account? Contact admin</div> --}}

<div class="text-center text-muted mt-3">
    Don't have an account? Contact admin {{-- Sesuaikan teks --}}
</div>

@endsection