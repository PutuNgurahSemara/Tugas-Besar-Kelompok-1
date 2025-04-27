<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Yajra\DataTables\DataTables;
use App\Http\Controllers\Controller;
use QCod\AppSettings\Setting\AppSettings;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $title = 'products';
        if ($request->ajax()) {
            $products = Product::with(['purchase.category'])->latest();
            return DataTables::of($products)
                ->addColumn('product',function($product){
                    $imageHtml = '';
                    $productName = 'Purchase Data Missing';
                    if(!empty($product->purchase)){
                        $productName = $product->purchase->product;
                        if(!empty($product->purchase->image)){
                            $imageHtml = '<div class="table-product-image-container">
                                            <img class="table-product-image" src="'.asset("storage/purchases/".$product->purchase->image).'" alt="product">
                                        </div>';
                        }
                    }
                    $nameHtml = '<div class="table-product-name">'.$productName.'</div>';
                    return $imageHtml . $nameHtml;
                })
                
                ->addColumn('category',function($product){
                    $category = '-';
                    if(!empty($product->purchase) && !empty($product->purchase->category)){
                        $category = $product->purchase->category->name;
                    }
                    return $category;
                })
                ->addColumn('price',function($product){   
                    return settings('app_currency','Rp').' '. number_format($product->price, 0, ',', '.');
                })
                ->addColumn('quantity',function($product){
                    return $product->purchase->quantity ?? '-';
                })
                ->addColumn('expiry_date',function($product){
                    return !empty($product->purchase->expiry_date) ? date_format(date_create($product->purchase->expiry_date),'d M, Y') : '-';
                })
                ->addColumn('action', function ($row) {
                    $editbtn = '<a href="'.route("products.edit", $row->id).'" class="editbtn"><button class="btn btn-info"><i class="fas fa-edit"></i></button></a>';
                    $deletebtn = '<a data-id="'.$row->id.'" data-route="'.route('products.destroy', $row->id).'" href="javascript:void(0)" id="deletebtn"><button class="btn btn-danger"><i class="fas fa-trash"></i></button></a>';
                    if (!auth()->user()->hasPermissionTo('edit-product')) {
                        $editbtn = '';
                    }
                    if (!auth()->user()->hasPermissionTo('destroy-purchase')) {
                        $deletebtn = '';
                    }
                    $btn = $editbtn.' '.$deletebtn;
                    return $btn;
                })
                ->rawColumns(['product','action'])
                ->make(true);
        }
        return view('admin.products.index',compact(
            'title'
        ));
    }
    

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $title = 'add product';
        $purchases = Purchase::get();
        return view('admin.products.create',compact(
            'title','purchases'
        ));
        
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $this->validate($request,[
            'product'=>'required|max:200',
            'price'=>'required|min:1',
            'discount'=>'nullable',
            'description'=>'nullable|max:255',
        ]);
        $price = $request->price;
        if($request->discount >0){
           $price = $request->discount * $request->price;
        }
        Product::create([
            'purchase_id'=>$request->product,
            'price'=>$price,
            'discount'=>$request->discount,
            'description'=>$request->description,
        ]);
        $notification = notify("Product has been added");
        return redirect()->route('products.index')->with($notification);
    }

    
    /**
     * Show the form for editing the specified resource.
     *
     * @param  \app\Models\Product $product
     * @return \Illuminate\Http\Response
     */
    public function edit(Product $product)
    {
        $title = 'edit product';
        $purchases = Purchase::get();
        return view('admin.products.edit',compact(
            'title','product','purchases'
        ));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \app\Models\Product $product
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Product $product)
    {
        $this->validate($request,[
            'product'=>'required|max:200',
            'price'=>'required',
            'discount'=>'nullable',
            'description'=>'nullable|max:255',
        ]);
        
        $price = $request->price;
        if($request->discount >0){
           $price = $request->discount * $request->price;
        }
       $product->update([
            'purchase_id'=>$request->product,
            'price'=>$price,
            'discount'=>$request->discount,
            'description'=>$request->description,
        ]);
        $notification = notify('product has been updated');
        return redirect()->route('products.index')->with($notification);
    }

     /**
     * Display a listing of expired resources.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function expired(Request $request){
        $title = "expired Products";
        if($request->ajax()){
            $products = Purchase::whereDate('expiry_date', '=', Carbon::now())->with('category')->get();
            return DataTables::of($products)
                ->addColumn('product',function($purchase){
                    $imageHtml = '';
                    $productName = $purchase->product;
                    if(!empty($purchase->image)){
                        $imageHtml = '<div class="table-product-image-container">
                                        <img class="table-product-image" src="'.asset("storage/purchases/".$purchase->image).'" alt="product">
                                    </div>';
                    }
                    $nameHtml = '<div class="table-product-name">'.$productName.'</div>';
                    return $imageHtml . $nameHtml;
                })
                
                ->addColumn('category',function($purchase){
                    return $purchase->category->name ?? '-';
                })
                ->addColumn('price',function($purchase){
                    return settings('app_currency','Rp').' '. number_format($purchase->cost_price, 0, ',', '.');
                })
                ->addColumn('quantity',function($purchase){
                    return $purchase->quantity;
                })
                ->addColumn('expiry_date',function($purchase){
                    return !empty($purchase->expiry_date) ? date_format(date_create($purchase->expiry_date),'d M, Y') : '-';
                })
                ->addColumn('action', function ($row) {
                    return '-';
                })
                ->rawColumns(['product','action'])
                ->make(true);
        }

        return view('admin.products.expired',compact(
            'title',
        ));
    }

    /**
     * Display a listing of out of stock resources.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function outstock(Request $request){
        $title = "outstocked Products";
        if($request->ajax()){
            $products = Purchase::where('quantity', '<=', 0)->with('category')->get();
            return DataTables::of($products)
                ->addColumn('product',function($purchase){
                    $image = '';
                    if(!empty($purchase->image)){
                        $image = '<span class="avatar avatar-sm mr-2">
                        <img class="avatar-img" src="'.asset("storage/purchases/".$purchase->image).'" alt="image">
                        </span>';
                    }
                    return $purchase->product. ' ' . $image;
                })
                
                ->addColumn('category',function($purchase){
                    $category = null;
                    if(!empty($purchase->category)){
                        $category = $purchase->category->name;
                    }
                    return $category;
                })
                ->addColumn('price',function($purchase){
                    return settings('app_currency','$').' '. $purchase->price;
                })
                ->addColumn('quantity',function($purchase){
                    return $purchase->quantity;
                })
                ->addColumn('expiry_date',function($purchase){
                    return !empty($purchase->expiry_date) ? date_format(date_create($purchase->expiry_date),'d M, Y') : '-';
                })
                ->addColumn('action', function ($row) {
                    return '-';
                })
                ->rawColumns(['product','action'])
                ->make(true);
        }

        return view('admin.products.outstock',compact(
            'title'
        ));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request)
    {
        return Product::findOrFail($request->id)->delete();
    }
}

