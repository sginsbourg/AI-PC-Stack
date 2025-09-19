import os
from crewai import Agent, Task, Crew, Process
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_openai import ChatOpenAI
import streamlit as st
from pydantic import BaseModel

# DuckDuckGo tool for gathering search results
tool = DuckDuckGoSearchRun()

# Configure the LLM to use Ollama (mistral model)
llm = ChatOpenAI(
    model="ollama/mistral",
    base_url="http://localhost:11434/v1",  # Local Ollama instance
    temperature=0.1  # Low temperature for consistent output
)

# Researcher Agent
News_Researcher = Agent(
    role="Senior Research Analyst",
    goal="Conduct comprehensive analysis of emerging trends and technologies in {topic}",
    verbose=True,
    memory=True,
    backstory="""You are a distinguished research analyst with expertise in emerging technologies 
    and market trends. With a Ph.D. in Technology Foresight and years of experience at leading 
    think tanks, you excel at identifying breakthrough innovations and their potential impact 
    on industries and society. Your analytical skills allow you to spot patterns and connections 
    that others might miss.""",
    tools=[tool],
    llm=llm,
    allow_delegation=True
)

# Writer Agent
News_Writer = Agent(
    role='Technology Journalist',
    goal='Create engaging and informative articles about {topic} for a general audience',
    verbose=True,
    memory=True,
    backstory="""You are an award-winning technology journalist known for making complex 
    subjects accessible to everyone. With a background in both science communication and 
    creative writing, you've mastered the art of transforming technical insights into 
    compelling narratives. Your articles have been featured in leading tech publications, 
    and you have a knack for finding the human angle in every story.""",
    tools=[tool],
    llm=llm,
    allow_delegation=False
)

# Streamlit Interface
st.set_page_config(page_title="Multi-Agent Article Generator", page_icon="📝", layout="wide")
st.markdown("""<style>
    .reportview-container {
        background: #f0f2f6
    }
    .main {
        background: #ffffff;
        padding: 3rem;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
</style>""", unsafe_allow_html=True)

st.header("Multi-Agent Article Generator")

topic = st.text_input("Enter the topic for the article:", "Artificial Intelligence in Healthcare")

if st.button("Generate Article"):
    with st.spinner("Researching and writing the article..."):
        try:
            # Research Task
            Research_task = Task(
                description=f""" 
                Perform an in-depth analysis of {topic} by addressing the following key areas:
                1. Overview of the current landscape and recent breakthroughs
                2. Identification of key players and innovations driving progress
                3. Analysis of market impact and emerging opportunities
                4. Exploration of the main technical challenges and potential solutions
                5. Future predictions and expected developments
                Ensure the research includes detailed examples, relevant statistics (where applicable), 
                and insights from credible sources. 
                """,
                expected_output="A detailed research report covering all major aspects of the topic, with specific examples and data points",
                tools=[tool],
                agent=News_Researcher,
                llm=llm
            )

            # Writing Task
            Write_task = Task(
                description=f""" 
                Using the research findings, craft an engaging article that:
                1. Starts with an attention-grabbing introduction
                2. Simplifies complex ideas using relatable analogies
                3. Incorporates practical examples and real-world use cases
                4. Explores the potential implications for various industries
                5. Concludes with a forward-looking perspective
                The article should have a balanced tone, being optimistic but realistic about the challenges. 
                Present the content in clear, well-organized markdown, with appropriate headings and sections for easy reading. 
                """,
                expected_output="A well-structured markdown article of 12-14 paragraphs with clear sections and engaging content",
                tools=[tool],
                agent=News_Writer,
                async_execution=False,
                output_file='blog.md',
                llm=llm
            )

            # Form the Crew
            news_crew = Crew(
                agents=[News_Researcher, News_Writer],
                tasks=[Research_task, Write_task],
                process=Process.sequential
            )

            # Run the crew
            result = news_crew.kickoff(inputs={"topic": topic})
            
            st.subheader("Generated Article")
            st.markdown(result)
            
            # Save to file
            with open('blog.md', 'w') as f:
                f.write(result)
            st.download_button("Download Article", result, file_name="article.md", mime="text/markdown")
        except Exception as e:
            st.error(f"Error generating article: {str(e)}")