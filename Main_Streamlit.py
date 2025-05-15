import streamlit as st
import pickle
import pandas as pd
import numpy as np
from PIL import Image
import plotly.express as px

# Load the trained model and data
model_path = "Downloads/Resturant_Succsess_prediction.sav"
data_path = '/Users/mohammedmahmood/Desktop/Code File/Streamlit code/Cleaned_data2.pkl'

with open(model_path, "rb") as file:
    Final_Model = pickle.load(file)

with open(data_path, "rb") as f:
    df = pickle.load(f)

# Set page configuration
st.set_page_config(page_title="Restaurant Success Prediction & Analytics", layout="wide")

# Custom CSS to style the tabs and labels
st.markdown(
    """
    <style>
    /* General styling for all tabs */
    .stTabs [role="tab"] {
        font-size: 37px  
        font-weigt: bold;
        padding: 20px 50px !important;  
        margin-right: 15px !important;  
        border-radius: 10px !important;  
    }

    /* Default style for both tabs when not active */
    .stTabs [role="tab"] {
        color: #ffffff !important;  
        background-color: #ff3b3b !important;  
        border: 2px solid #ff3b3b !important;  
    }

    /* Style for the active tab */
    .stTabs [role="tab"][aria-selected="true"] {
        color: #ffffff !important;  
        background-color: #2f2f2f !important;  
        border: 2px solid #ffffff !imptant;  
        border-bottom: 3px solid #ff5622 !important;  
    }

    /* Hover effect for better interactivity */
    .stTabs [role="tab"]:hover {
        opacity: 0.7 !important;  
    }

  /* Style for the " New Restaurant Success Prediction & Analytics app" label (main title) */
    .new-restaurant-label {
        font-size: 56px !important;  
        font-weigt: bold;
        color: white !important;  
        text-align: center;
        margin-bottom: 20px !important;  
        margin-top: 20px !important;  
        width: 100%;  
    }

    <style>
    /* Style for the "Please Choose a Tab" label (above the tabs, aligned to the left) */
    .choose-tab-label {
        font-size: 30px !important;  
        font-weight: bold;
        color: #ffffff !important;  
        text-align: left;  
        margin-bottom: 15px !important;  
        margin-top: 10px !important;  
        margin-left: 20px !important;  
        width: 100%;  
    }
    </style>
    """,
    unsafe_allow_html=True
)



# Main title
st.markdown(
    '<div class="new-restaurant-label"> New Restaurants Success Prediction & Analytics Web App </div>',
    unsafe_allow_html=True
)

# Secondary label: "Choose a Tab" (above the tabs, aligned to the left)
st.markdown('<div class="choose-tab-label"> Please Choose a Tab </div>', unsafe_allow_html=True)
# Create tabs 
tab0, tab1, tab2 = st.tabs(["Website Overview", "Prediction Page", "Analytics & Insights Page"])  

# Tab 0: Overview Section
with tab0:    
    st.markdown(
    """
    <div style='font-size: 23px; text-align: center; color: #ffffff;'>
    Welcome to the <strong> New Restaurant Success Prediction & Analytics</strong> app! This project aims to help aspiring restauranteurs and existing restaurant owners in Bangalore make data-driven decisions to improve their chances of success.
    </div>
    """,
    unsafe_allow_html=True )
    
    st.markdown(
        "<div style='margin-top: 40px;'></div>",
        unsafe_allow_html=True
        )
    
    image = Image.open("/Users/mohammedmahmood/Desktop/restaurant-1000x550.jpg")
    st.image(image, use_column_width=True)
    
    # Key points about the project 
    st.markdown("### 1) About the App: ")
    st.markdown("##### - Objective: Predict the success of new restaurants and provide actionable insights using data analytics.")
    st.markdown("##### - Dataset: Based on a cleaned dataset of Bangalore restaurants, including many columns")
    st.markdown("##### - Methodology: Uses a machine learning to predict success of resturants based on resturant's data and offers interactive visualizations cantain analytics and insights from data")

    # App features 
    st.markdown("### 2) What You Can Do in App: ")
    st.markdown( " ##### 1- Success Prediction Page: Input your restaurant details to predict its likelihood of success.")
    st.markdown( " ##### 2- Data Analytics Page: Explore visualizations and insights on restaurant success factors in Bangalore, such as the impact of table booking, restaurant type, and cost.. ")

  
    st.markdown(
                  """
                <div style='font-size: 23px; text-align: center; color: #ffffff;'>
               <strong>Start exploring now!</strong> Head to the <span style='color: #ff3b3b;'> Prediction Page</span> to test your restaurant idea, or visit the <span style='color: #ff3b3b;'> Analytics Page</span> for in-depth insights.
                </div>
                  """,
    unsafe_allow_html=True
)

# Tab 1: Prediction Section
with tab1:
    st.markdown("<h1 style='text-align: center;'> Sucsess Prediction Page</h1>", unsafe_allow_html=True)
    
    st.markdown("### This page helps you predict your restaurant's success by :")
    st.markdown("##### 1- spiring Restaurateurs: Input your restaurant details to get a data-driven prediction of success before opening, helping you make informed decisions")
    st.markdown("##### 2- Existing Restaurant Owners: Test different scenarios (Like adding online ordering or changing location) to see how they impact your success probability")
    st.markdown("##### 3- Investors and Analysts: Evaluate the potential success of restaurant ventures in Bangalore to guide investment choices. ")
    
    st.markdown("## Please enter your restaurant Details ")

    # Input fields
    online_order = st.selectbox("### Online Order Availability", ["Yes", "No"], key="pred_online_order")
    book_table = st.selectbox("Book Table Availability", ["Yes", "No"], key="pred_book_table")
    location = st.selectbox("Choose Restaurant Location", [
        'Banashankari', 'Basavanagudi', 'other', 'Jayanagar', 'JP Nagar',
        'Bannerghatta Road', 'BTM', 'Electronic City', 'Shanti Nagar',
        'Koramangala 5th Block', 'Richmond Road', 'HSR',
        'Koramangala 6th Block', 'Bellandur', 'Sarjapur Road',
        'Marathahalli', 'Whitefield', 'Old Airport Road', 'Indiranagar',
        'Koramangala 1st Block', 'Frazer Town', 'MG Road', 'Brigade Road',
        'Lavelle Road', 'Church Street', 'Ulsoor', 'Residency Road',
        'Shivajinagar', 'St. Marks Road', 'Cunningham Road',
        'Commercial Street', 'Vasanth Nagar', 'Domlur',
        'Koramangala 7th Block', 'Ejipura', 'Jeevan Bhima Nagar',
        'Kammanahalli', 'Koramangala 5th Block', 'Brookefield',
        'Koramangala 3th Block', 'Banaswadi', 'Kalyan Nagar',
        'Malleshwaram', 'Rajajinagar', 'New BEL Road'
    ], key="pred_location")
    avg_cost_location = st.slider("Average Cost of Restaurants in Location", min_value=170, max_value=600, step=5, key="pred_avg_cost_location")

    rest_type = st.selectbox("Choose Restaurant Type", [
        'Casual Dining', 'Cafe', 'Quick Service', 'Delivery/Takeaway',
        'Dessert', 'Bakery', 'Bar/Pub', 'Street Food', 'Fine Dining',
        'Microbrewery', 'Lounge/Club'
    ], key="pred_rest_type" )
    cuisines_count = st.selectbox("How many cuisines will your restaurant offer?", [1, 2, 3, 4, 5, 6, 7, 8], key="pred_cuisines_count")

    # Auto detect cuisine type
    st.markdown("""
    ### 💡 We classify restaurants  based on the number of cuisines they offer in cuisine type  
    - **Simple**: Offersup to 2 cuisines.
    - **Mixed**: Offers 2 to 3 cuisines.
    - **Diverse**: Offers 5 or more cuisines.
    """)

    if cuisines_count <= 2:
        cuisine_type = "Simple"
    elif cuisines_count <= 3:
        cuisine_type = "Mixed"
    else:
        cuisine_type = "Diverse"

    st.markdown("## cuisines count")
    st.markdown(
        f"""
        <div style='
            background-color: #212529;
            padding: 15px 20px;
            border: 1px solid #444;
            border-radius: 10px;
            font-size: 20px;
            font-weight: weight;
            color: white;
            margin-top: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        '>
           Auto detected cuisine type based on number of cuisines the user will input: 
            <span style='color: #ff4b4b;'>{cuisine_type}</span>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(
        "<div style='margin-top: 40px;'></div>",
        unsafe_allow_html=True
        )
     
    cost_per_person = st.slider("Estimated Cost Per Person", min_value=20, max_value=2000, step=10, key="pred_cost_per_person")

    # Auto detect cost category
    st.markdown("""
    #### 💡 We classfy restaurants based on their cost per person:
    - **Low**:  to 200  
    - **Mid**: 201 to 600  
    - **High**: 601 to 1500  
    - **Very High**: 1501 to 2500  
    - **Luxury**: 2501 and above
    """)
    if cost_per_person <= 200:
        cost_category = "Low"
    elif cost_per_person <= 600:
        cost_category = "Mid"
    elif cost_per_person <= 1500:
        cost_category = "High"
    elif cost_per_person <= 2500:
        cost_category = "Very High"
    else:
        cost_category = "Luxury"

    st.markdown("## cost category")
    st.markdown(
        f"""
        <div style='
            background-color: #212529;
            padding: 15px 20px;
            border: 1px solid #444;
            border-radius: 10px;
            font-size: 20px;
            font-weight: weight;
            color: white;
            margin-top: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        '>
            Auto detected cost category, based on cost per person user will input: 
            <span style='color: #ff4b4b;'>{cost_category}</span>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Add extra space before the buttons
    st.markdown(
        "<div style='margin-top: 40px;'></div>",
        unsafe_allow_html=True
        )
    
    # Prediction button
    if st.button("Predict Success of your restaurant", key="pred_button"):
        # Create input DataFrame
        input_df = pd.DataFrame({
            'online_order': [online_order],
            'book_table': [book_table],
            'location': [location],
            'avg_cost_location': [avg_cost_location],
            'rest_type': [rest_type],
            'cuisines_count': [cuisines_count],
            'cuisine_type': [cuisine_type],
            'cost_per_person': [cost_per_person],
            'cost_category': [cost_category]
        })

        # Add log-transformed feature
        input_df['log_cost_per_person'] = np.log1p(input_df['cost_per_person'])

        # Make prediction
        prediction = Final_Model.predict(input_df)[0]
        result = "✅ Your restaurant is likely to be **successful based on your data**!" if prediction == 1 else "❌ Your restaurant is likely to **fail based on your data**."

        st.subheader(" Your Prediction Result")
        if prediction == 1:
            st.success(result)
        else:
            st.error(result)

###### Tab 2: Analytics Section  ###### 
with tab2:
    st.markdown("<h1 style='text-align: center;'> Analytics & Insights Page</h1>", unsafe_allow_html=True)
    
    st.markdown("### This page provides valuable insights for :")
    st.markdown("##### 1- Aspiring Restaurateurs: Understand key factors that influence restaurant success before launching your business.")
    st.markdown("##### 2- Existing Restaurant: Owners: Optimize pricing, refine menus or adjust operations using data-driven insights to boost success rates.")
    st.markdown("##### 3- Investors and Analysts: Identify trends and opportunities in Bangalore's restaurant market to make informed investment decisions.")
    
    
    #### Question 1: Top 10 Locations with the Most Successful Restaurants ####
    st.markdown("# 1- What are the Top 10 Locations with the Most Successful Restaurants?")

    successful_restaurants = df[df['Success'] == 1]
    successful_count = successful_restaurants.groupby('location').size().reset_index(name='Success')
    top_10_locations = successful_count.sort_values(by='Success', ascending=False).head(10)

    fig = px.bar(top_10_locations, x='location', y='Success',
                 title='Top 10 Locations with the Most Successful Restaurants',
                 labels={'location': 'Location', 'Success': 'Number of Successful Restaurants'},
                 color='Success', text='Success')
    fig.update_traces(texttemplate='%{text}', textposition='inside', insidetextanchor='start')
    st.plotly_chart(fig)
    
    #### Question 2: Does the Combination of Online Order and Table Booking Affect Success? ####
    st.markdown("# 2- Does the Combination of Online Order and Table Booking Affect Success?")

    combo_success = df.groupby(['online_order', 'book_table'])['Success'].mean().reset_index()

    fig = px.bar(combo_success, x='online_order', y='Success', color='book_table',
                 text=combo_success['Success'].apply(lambda x: f"{x:.1%}"),
                 barmode='group', title='Success Rate by Combination of Online Order and Book Table')
    fig.update_traces(textposition='outside')
    fig.update_yaxes(title='Success Rate')
    st.plotly_chart(fig)

    st.markdown("## Results & Insights")
    st.markdown("#### Restaurants that allow table booking — with or without online orders — have a much higher chance of success.")

    #### Question 3: How Does the Combination of Restaurant Type and Table Booking Affect Restaurant Success? ####
    st.markdown("# 3- How Does the Combination of Restaurant Type and Table Booking Affect Restaurant Success?")

    rest_table_success = df.groupby(['rest_type', 'book_table'])['Success'].mean().reset_index()

    fig = px.bar(rest_table_success, x='rest_type', y='Success', color='book_table',
                 barmode='group', text=rest_table_success['Success'].apply(lambda x: f"{x:.1%}"),
                 title='Success Rate by Restaurant Type and Table Booking')
    fig.update_traces(textposition='outside')
    fig.update_layout(yaxis_tickformat=".0%", xaxis_tickangle=-35, uniformtext_minsize=7, uniformtext_mode='hide')
    st.plotly_chart(fig)

    st.markdown("## Results & Insights")
    st.markdown("""
    #### 1- Book Table = Yes Leads to Much Higher Success for Almost All Types
    Especially true for:
    - **Bakery**: 100% vs 22.6%
    - **Street Food**: 100% vs 15.5%
    - **Fine Dining**: 86.7% vs 57.3%
    - **Bar/Pub**: 81.3% vs 35.5%

    #### 2- Highest Performing Types *with* Booking
    - **Fine Dining** (86.7%)
    - **Street Food** (100%)
    - **Bakery** (100%)
    - **Microbrewery** (83.1%)
    - **Bar/Pub** (81.3%)
    #### 2- Low Success When Book Table = No
    - **Street Food**: Only **15.5** success  
    - **Delivery/Takeaway**: **22.2%**
    - **Quick Service**: **22.5%**
    """)

    #### Question 4: Top 10 Most Voted Restaurants and Their Type ####
    st.markdown("# 4- What Are the Top 10 Most Voted Restaurants in Bangalore and Their Restaurant Type?")

    top_10_voted = df[['name', 'votes', 'rest_type']].sort_values(by='votes', ascending=False).drop_duplicates('name').head(10)

    fig = px.bar(top_10_voted, x='name', y='votes', color='rest_type', text='votes',
                 title='Top 10 Most Voted Restaurants in Bangalore and Their Type')
    fig.update_traces(textposition='inside')
    fig.update_layout(xaxis_tickangle=-35)
    st.plotly_chart(fig)

    #### Question 5: Top 10 Rated Restaurants ####
    st.markdown("# 5- What Are the Top 10 Rated Restaurants?")

    top10_rated = df.groupby("name")["rate"].mean().sort_values(ascending=False).reset_index().iloc[1:11]

    fig = px.bar(top10_rated, x='name', y='rate', text='rate', title='Top Rated Restaurants',
                 color='rate', color_continuous_scale='viridis')
    fig.update_traces(texttemplate='%{text:.2f}', textposition='inside')
    fig.update_layout(xaxis_tickangle=-35)
    st.plotly_chart(fig)

    #### Question 6: Top 10 Expensive Restaurant Types ####
    st.markdown("# 6- What Are the Top 10 Expensive Restaurant Types on Average?")

    top10_cost = df.groupby("rest_type")['cost_per_person'].mean().sort_values(ascending=False).head(10).reset_index()

    fig = px.bar(top10_cost, x='rest_type', y='cost_per_person', text='cost_per_person', color='cost_per_person',
                 title='Top 10 Expensive Restaurant Types (Average Cost per Person)', color_continuous_scale='sunset')
    fig.update_traces(texttemplate='%{text:.0f}', textposition='inside')
    fig.update_layout(xaxis_tickangle=-35)
    st.plotly_chart(fig)

    #### Question 7: Success Percentage for Each Restaurant Type ####
    st.markdown("# 7- What Is the Success Percentage for Each Restaurant Type?")

    rest_success = df.groupby('rest_type')['Success'].mean().sort_values(ascending=False).reset_index()
    rest_success['Success'] = rest_success['Success'] * 100

    fig = px.bar(rest_success, x='rest_type', y='Success', text='Success', title='Success Percentage by Restaurant Type',
                 color='Success', color_continuous_scale='teal')
    fig.update_traces(texttemplate='%{text:.1f}%', textposition='inside')
    fig.update_layout(xaxis_tickangle=-35)
    st.plotly_chart(fig)
    
    st.markdown("## Results & Insights")
    st.markdown("""
    #### 1- Highest Success Rates Across Restaurant Types
    - **Microbrewery**: Leads with a **92.4%** success rate, thriving due to premium offerings.
    - **Fine Dining**: Close behind at **92.1%**, appealing to high-end customers.
    - **Lounge/Club**: **75.4%**, benefiting from exclusivity and ambiance.

    #### 2- Moderate Success Rates
   - **Bar/Pub**: **70.6%**, popular but faces competition.
   - **Casual Dining**: **56.4%**, appeals to a broad audience.
   - **Cafe**: **55.4%**, moderately successful with steady demand.

   #### 3- Lowest Success Rates
   - **Street Food**: Only **15.7%**, likely due to market saturation.
   - **Delivery/Takeaway**: **22.3%**, struggles with customer retention.
   - **Quick Service**: **22.6%**, faces challenges in a competitive market.
   - **Bakery**: **22.9%**, needs innovation to improve success.
   - **Dessert**: **51.9%**, moderate but below average for most types. 
  """)
    
    #### Question 8: Does Cost per Person Vary by Restaurant Type and Influence Success? ####
    st.markdown("# 8- Does Cost per Person Vary by Restaurant Type and Influence Success?")

    rest_cost_success = df.groupby(['rest_type', 'Success'])['cost_per_person'].mean().reset_index()

    fig = px.bar(rest_cost_success, x='rest_type', y='cost_per_person', color='Success', barmode='group',
                 text='cost_per_person', title='Cost per Person by Restaurant Type and Success')
    fig.update_traces(texttemplate='%{text:.0f}', textposition='inside')
    fig.update_layout(xaxis_tickangle=-35)
    st.plotly_chart(fig)

    st.markdown("## Results & Insights")
    st.markdown("""
    - **Fine Dining, Lounge/Club, and Microbrewery** are high-risk, high-reward types — they’re expensive but tend to have a strong success rate when executed well.
    - **Quick Service** and **Street Food** offer lower average prices yet can perform well, making them attractive options for startups or small investors.
    - **Bar/Pub** and **Casual Dining** sit in the moderate-cost range and display mixed success, depending on other factors such as service and location.
    """)
    
    #### Final Recommendations ####
    st.markdown(
    "<h2 style='font-size: 32px; text-align: center;'>Recommendations for a Successful Restaurant Based on Analysis</h2>",
    unsafe_allow_html=True
)
    
    st.markdown("##### 1- Implement Online Ordering and Table Booking: These features significantly increase success rates (58.8% for online ordering, up to 100% for some restaurant types with table booking) by enhancing customer convenience and commitment ")
    st.markdown("##### 2- Choose the Right Location: Target high-success areas like **Koramangala 5th Block** or consider emerging locations like **HSR** to balance demand and competition.")
    st.markdown("##### 3- Select a Strategic Restaurant Type:")
    st.markdown("""               
  - ** Microbreweries and Fine Dining**: High success rates (around 82%) but require significant investment.
  - ** Casual Dining and Cafes: Moderate success with broad appeal.
  - ** Quick Service or Street Food**: Lower-risk options, especially when paired with table booking.
""")    
    
    st.markdown("##### 4- Focus on Quality and Experience: Prioritize high ratings and customer engagement (e.g., through reviews and social media) to build a strong reputation and retain customers.")
    st.markdown("#####  5- Manage Costs Wisely: Align your restaurant type with your budget and invest in systems like online ordering that boost success.")

