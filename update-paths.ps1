# PowerShell script to update all file paths in HTML files

$htmlFiles = Get-ChildItem -Path "c:\Users\Admin\myfolder\cafeman\*.html"

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Update CSS paths
    $content = $content -replace '"/css/', '"frontend/css/'
    $content = $content -replace "'/css/", "'frontend/css/"
    $content = $content -replace 'href="/css/', 'href="frontend/css/'
    
    # Update JS paths
    $content = $content -replace '"/js/', '"frontend/js/'
    $content = $content -replace "'/js/", "'frontend/js/"
    $content = $content -replace 'src="/js/', 'src="frontend/js/'
    $content = $content -replace 'js/tailwind.config.js', 'frontend/js/tailwind.config.js'
    
    # Update page links - /pages/ prefix
    $content = $content -replace '"/pages/login.html"', '"login.html"'
    $content = $content -replace "'/pages/login.html'", "'login.html'"
    $content = $content -replace '"/pages/signup.html"', '"signup.html"'
    $content = $content -replace "'/pages/signup.html'", "'signup.html'"
    
    # Update admin page links
    $content = $content -replace '"/pages/admin/dashboard.html"', '"admin-dashboard.html"'
    $content = $content -replace "'/pages/admin/dashboard.html'", "'admin-dashboard.html'"
    $content = $content -replace '"/pages/admin/products.html"', '"admin-products.html"'
    $content = $content -replace "'/pages/admin/products.html'", "'admin-products.html'"
    $content = $content -replace '"/pages/admin/floors.html"', '"admin-floors.html"'
    $content = $content -replace "'/pages/admin/floors.html'", "'admin-floors.html'"
    $content = $content -replace '"/pages/admin/tables.html"', '"admin-tables.html"'
    $content = $content -replace "'/pages/admin/tables.html'", "'admin-tables.html'"
    $content = $content -replace '"/pages/admin/payments.html"', '"admin-payments.html"'
    $content = $content -replace "'/pages/admin/payments.html'", "'admin-payments.html'"
    $content = $content -replace '"/pages/admin/reports.html"', '"admin-reports.html"'
    $content = $content -replace "'/pages/admin/reports.html'", "'admin-reports.html'"
    $content = $content -replace '"/pages/admin/settings.html"', '"admin-settings.html"'
    $content = $content -replace "'/pages/admin/settings.html'", "'admin-settings.html'"
    
    # Update cashier page links
    $content = $content -replace '"/pages/cashier/dashboard.html"', '"cashier-dashboard.html"'
    $content = $content -replace "'/pages/cashier/dashboard.html'", "'cashier-dashboard.html'"
    $content = $content -replace '"/pages/cashier/floor.html"', '"cashier-floor.html"'
    $content = $content -replace "'/pages/cashier/floor.html'", "'cashier-floor.html'"
    $content = $content -replace '"/pages/cashier/orders.html"', '"cashier-orders.html"'
    $content = $content -replace "'/pages/cashier/orders.html'", "'cashier-orders.html'"
    $content = $content -replace '"/pages/cashier/register.html"', '"cashier-register.html"'
    $content = $content -replace "'/pages/cashier/register.html'", "'cashier-register.html'"
    $content = $content -replace '"/pages/cashier/session.html"', '"cashier-session.html"'
    $content = $content -replace "'/pages/cashier/session.html'", "'cashier-session.html'"
    
    # Update customer page links
    $content = $content -replace '"/pages/customer/menu.html"', '"customer-menu.html"'
    $content = $content -replace "'/pages/customer/menu.html'", "'customer-menu.html'"
    $content = $content -replace '"/pages/customer/floors.html"', '"customer-floors.html"'
    $content = $content -replace "'/pages/customer/floors.html'", "'customer-floors.html'"
    $content = $content -replace '"/pages/customer/cart.html"', '"customer-cart.html"'
    $content = $content -replace "'/pages/customer/cart.html'", "'customer-cart.html'"
    $content = $content -replace '"/pages/customer/payment.html"', '"customer-payment.html"'
    $content = $content -replace "'/pages/customer/payment.html'", "'customer-payment.html'"
    $content = $content -replace '"/pages/customer/order-tracking.html"', '"customer-order-tracking.html"'
    $content = $content -replace "'/pages/customer/order-tracking.html'", "'customer-order-tracking.html'"
    $content = $content -replace '"/pages/customer/feedback.html"', '"customer-feedback.html"'
    $content = $content -replace "'/pages/customer/feedback.html'", "'customer-feedback.html'"
    
    # Update kitchen page links
    $content = $content -replace '"/pages/kitchen/display.html"', '"kitchen-display.html"'
    $content = $content -replace "'/pages/kitchen/display.html'", "'kitchen-display.html'"
    
    # Save the updated content
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "All HTML files updated successfully!"
