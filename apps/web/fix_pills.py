with open(r'I:\xampp8212\htdocs\oneoceanonelife\apps\web\src\app\economy\page.tsx', 'r') as f:
    content = f.read()

# Replace the isActive className
old1 = 'className={isActive ? "bg-ocean-navy/20 text-ocean-navy border-ocean-navy/50 shadow-lg" : "bg-white/5 border-b-transparent hover:bg-white/10 hover:border-ocean-navy/30 text-ocean-sand hover:text-ocean-navy"}'
new1 = 'className={isActive ? "bg-ocean-navy/20 text-ocean-navy border-ocean-navy/50 shadow-lg" : "bg-ocean-navy/10 border-ocean-navy/20 rounded-full text-ocean-navy hover:text-ocean-forest transition-colors"}'

content = content.replace(old1, new1)

# Replace any remaining bg-white/5
content = content.replace('bg-white/5', 'bg-ocean-navy/10')

with open(r'I:\xampp8212\htdocs\oneoceanonelife\apps\web\src\app\economy\page.tsx', 'w') as f:
    f.write(content)
    
print('Done - navigation pill classes updated')
"