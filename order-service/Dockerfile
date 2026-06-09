# Gunakan image Python yang ringan
FROM python:3.9-slim

# Set working directory di dalam container
WORKDIR /app

# Copy requirements.txt dan install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code ke dalam container
COPY . .

# Expose port yang digunakan oleh Flask (misalnya 5000)
EXPOSE 5000

# Command untuk menjalankan aplikasi
CMD ["python", "app.py"]
