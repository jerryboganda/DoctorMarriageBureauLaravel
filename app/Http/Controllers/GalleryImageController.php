<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryImage;
use App\Models\Member;
use Auth;

class GalleryImageController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $gallery_images = GalleryImage::where('user_id',Auth::user()->id)->latest()->paginate(10);
        return view('frontend.member.gallery_image.index', compact('gallery_images'));
    }



    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
      if(package_validity(Auth::user()->id)){
        if( get_remaining_package_value(Auth::user()->id,'remaining_photo_gallery') > 0){
          
          // Get the gallery image IDs from request
          $gallery_image_ids = $request->gallery_image;
          
          if(empty($gallery_image_ids)) {
            flash(translate('Please select at least one image.'))->error();
            return back();
          }
          
          // Split comma-separated IDs
          $image_ids = explode(',', $gallery_image_ids);
          $image_ids = array_filter($image_ids); // Remove empty values
          
          $success_count = 0;
          
          foreach($image_ids as $image_id) {
            $image_id = trim($image_id);
            if(!empty($image_id)) {
              $gallery_image = new GalleryImage;
              $gallery_image->user_id = Auth::user()->id;
              $gallery_image->image = $image_id;
              
              if($gallery_image->save()){
                $success_count++;
              }
            }
          }
          
          if($success_count > 0){
            // Update remaining gallery count
            $member = Member::where('user_id', Auth::user()->id)->first();
            $member->remaining_photo_gallery = $member->remaining_photo_gallery - $success_count;
            $member->save();
            
            flash(translate($success_count . ' gallery image(s) uploaded successfully.'))->success();
            return redirect()->route('gallery-image.index');
          }
          else{
            flash(translate('Something went Wrong.'))->error();
            return back();
          }
        }
        else{
          flash(translate('You have 0 Remaining Gallery Photo upload. Please update your package.'))->error();
          return back();
        }
      }
      else{
        flash(translate('Your package has been expired. Please update your package.'))->error();
        return back();
      }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        if(GalleryImage::destroy($id)){
            flash(translate('Image deleted successfully'))->success();
            return redirect()->route('gallery-image.index');
        }
        else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }
}
