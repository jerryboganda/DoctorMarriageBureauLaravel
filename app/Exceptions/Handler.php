<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'password',
        'password_confirmation',
    ];

    /**
     * Report or log an exception.
     *
     * @return void
     *
     * @throws \Exception
     */
    public function report(Throwable $exception)
    {
        if (app()->bound('request') && request()->is('api/*')) {
            $request = request();

            Log::error('API exception', [
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
                'route' => optional($request->route())->uri(),
                'method' => $request->method(),
                'path' => $request->path(),
                'user_id' => optional($request->user())->id,
                'request_id' => $request->headers->get('X-Request-Id'),
                'ip' => $request->ip(),
            ]);
        }

        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  Request  $request
     * @return Response
     *
     * @throws Throwable
     */
    public function render($request, Throwable $exception)
    {
        return parent::render($request, $exception);
    }

    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return redirect()->guest(route('login'));
    }
}
