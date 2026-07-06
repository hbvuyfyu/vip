package com.king.app

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorView: LinearLayout
    private lateinit var errorText: TextView
    private lateinit var retryButton: Button

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Array<Uri>>

    companion object {
        private const val HOME_URL = "https://king-app.netlify.app"
        private const val WHATSAPP_NUMBER = "15043253235"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        errorView = findViewById(R.id.errorView)
        errorText = findViewById(R.id.errorText)
        retryButton = findViewById(R.id.retryButton)

        fileChooserLauncher = registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
            if (uris != null && uris.isNotEmpty()) {
                fileChooserCallback?.onReceiveValue(uris.toTypedArray())
            } else {
                fileChooserCallback?.onReceiveValue(null)
            }
            fileChooserCallback = null
        }

        setupWebView()
        loadUrl(HOME_URL)

        retryButton.setOnClickListener {
            errorView.visibility = View.GONE
            webView.visibility = View.VISIBLE
            loadUrl(HOME_URL)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            userAgentString = userAgentString.replace("; wv", "")
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
        }

        WebView.setWebContentsDebuggingEnabled(false)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showError("Unable to load. Check your internet connection and try again.")
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url ?: return false
                if (url.scheme == "https" || url.scheme == "http") {
                    return false
                }
                if (url.scheme == "whatsapp" || url.scheme == "intent") {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, url)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        startActivity(intent)
                    } catch (_: Exception) {
                        openWhatsApp()
                    }
                    return true
                }
                if (url.scheme == "mailto" || url.scheme == "tel") {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, url)
                        startActivity(intent)
                    } catch (_: Exception) {
                    }
                    return true
                }
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.visibility = View.VISIBLE
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback
                try {
                    val accept = fileChooserParams?.acceptTypes ?: arrayOf("*/*")
                    val mimeTypes = if (accept.isEmpty() || accept.contentEquals(arrayOf(""))) arrayOf("*/*") else accept
                    fileChooserLauncher.launch(mimeTypes)
                } catch (_: Exception) {
                    fileChooserCallback = null
                    return false
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebViewCompat.setSafeBrowsingAllowlist(setOf(HOME_URL)) { _ -> }
        }
    }

    private fun loadUrl(url: String) {
        webView.visibility = View.VISIBLE
        errorView.visibility = View.GONE
        webView.loadUrl(url)
    }

    private fun showError(message: String) {
        webView.visibility = View.GONE
        progressBar.visibility = View.GONE
        errorView.visibility = View.VISIBLE
        errorText.text = message
    }

    private fun openWhatsApp() {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$WHATSAPP_NUMBER"))
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
        } catch (_: Exception) {
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        webView.apply {
            stopLoading()
            removeAllViews()
            destroy()
        }
        super.onDestroy()
    }
}
