import requests
import sys
from datetime import datetime

class FuelAppAPITester:
    def __init__(self, base_url="https://server-setup-26.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, params=None, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}")
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "healthz",
            200
        )
        if success and isinstance(response, dict):
            return response.get('status') == 'ok'
        return False

    def test_cities_search(self, query="Milano"):
        """Test cities search endpoint"""
        success, response = self.run_test(
            f"Cities Search - {query}",
            "GET",
            "fuel/cities",
            200,
            params={"q": query}
        )
        if success and isinstance(response, list):
            if len(response) > 0:
                # Check if response has required fields
                first_city = response[0]
                has_comune = 'comune' in first_city
                has_provincia = 'provincia' in first_city
                print(f"   Found {len(response)} cities")
                print(f"   First city: {first_city}")
                return has_comune and has_provincia
            else:
                print(f"   No cities found for query: {query}")
                return True  # Empty result is valid
        return False

    def test_fuel_types(self):
        """Test fuel types endpoint"""
        success, response = self.run_test(
            "Fuel Types",
            "GET",
            "fuel/fuels",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} fuel types")
            if len(response) > 0:
                print(f"   Fuel types: {response[:5]}")  # Show first 5
            return True
        return False

    def test_stations_by_city(self, comune="MILANO", fuel="Gasolio"):
        """Test stations endpoint"""
        success, response = self.run_test(
            f"Stations - {comune} ({fuel})",
            "GET",
            "fuel/stations",
            200,
            params={"comune": comune, "fuel": fuel}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} stations")
            if len(response) > 0:
                first_station = response[0]
                required_fields = ['id', 'gestore', 'nome', 'indirizzo', 'lat', 'lng', 'prezzi']
                has_all_fields = all(field in first_station for field in required_fields)
                print(f"   First station: {first_station}")
                
                # Check prezzi structure
                if 'prezzi' in first_station and len(first_station['prezzi']) > 0:
                    first_price = first_station['prezzi'][0]
                    price_fields = ['tipo', 'prezzo', 'self_service']
                    has_price_fields = all(field in first_price for field in price_fields)
                    print(f"   First price: {first_price}")
                    return has_all_fields and has_price_fields
                return has_all_fields
            else:
                print(f"   No stations found for {comune}")
                return True  # Empty result might be valid
        return False

    def test_stations_without_fuel_filter(self, comune="MILANO"):
        """Test stations endpoint without fuel filter"""
        success, response = self.run_test(
            f"Stations - {comune} (All fuels)",
            "GET",
            "fuel/stations",
            200,
            params={"comune": comune}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} stations (all fuels)")
            return True
        return False

def main():
    print("🚀 Starting Italian Fuel Price App API Tests")
    print("=" * 60)
    
    # Setup
    tester = FuelAppAPITester()
    
    # Run tests
    print("\n📋 Running Backend API Tests...")
    
    # Test 1: Health check
    health_ok = tester.test_health_endpoint()
    
    # Test 2: Cities search
    cities_ok = tester.test_cities_search("Milano")
    
    # Test 3: Fuel types
    fuels_ok = tester.test_fuel_types()
    
    # Test 4: Stations with fuel filter
    stations_filtered_ok = tester.test_stations_by_city("MILANO", "Gasolio")
    
    # Test 5: Stations without fuel filter
    stations_all_ok = tester.test_stations_without_fuel_filter("MILANO")
    
    # Test 6: Try different city
    cities_rome_ok = tester.test_cities_search("Roma")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    # Overall assessment
    critical_tests = [health_ok, cities_ok, fuels_ok, stations_filtered_ok]
    critical_passed = sum(critical_tests)
    
    print(f"\n🎯 Critical Tests: {critical_passed}/4 passed")
    
    if critical_passed == 4:
        print("✅ All critical backend functionality working!")
        return 0
    else:
        print("❌ Some critical backend functionality failing!")
        return 1

if __name__ == "__main__":
    sys.exit(main())