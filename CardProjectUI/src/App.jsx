import Card from './components/Card'

const App = () => {

  const jobOpenings = [
    {
      brandLogo: "https://pngimg.com/uploads/meta/meta_PNG12.png",
      companyName: "Meta",
      datePosted: "5 days ago",
      post: "Frontend Engineer",
      tag1: "Full Time",
      tag2: "Junior Level",
      pay: "$65/hour",
      location: "Menlo Park, USA"
    },
    {
      brandLogo: "https://static.vecteezy.com/system/resources/previews/014/018/561/non_2x/amazon-logo-on-transparent-background-free-vector.jpg",
      companyName: "Amazon",
      datePosted: "2 weeks ago",
      post: "Backend Developer",
      tag1: "Full Time",
      tag2: "Mid Level",
      pay: "$70/hour",
      location: "Hyderabad, India"
    },
    {
      brandLogo: "https://substackcdn.com/image/fetch/$s_!G1lk!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8ed3d547-94ff-48e1-9f20-8c14a7030a02_2000x2000.jpeg",
      companyName: "Apple",
      datePosted: "3 weeks ago",
      post: "iOS Developer",
      tag1: "Part Time",
      tag2: "Senior Level",
      pay: "$90/hour",
      location: "Cupertino, USA"
    },
    {
      brandLogo: "https://images.ctfassets.net/4cd45et68cgf/Rx83JoRDMkYNlMC9MKzcB/2b14d5a59fc3937afd3f03191e19502d/Netflix-Symbol.png?w=700&h=456",
      companyName: "Netflix",
      datePosted: "10 days ago",
      post: "Machine Learning Engineer",
      tag1: "Full Time",
      tag2: "Senior Level",
      pay: "$110/hour",
      location: "Los Gatos, USA"
    },
    {
      brandLogo: "data:image/png;base64,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",
      companyName: "Google",
      datePosted: "1 week ago",
      post: "Cloud Solutions Architect",
      tag1: "Full Time",
      tag2: "Mid Level",
      pay: "$85/hour",
      location: "Pune, India"
    },
    {
      brandLogo: "https://download.logo.wine/logo/Microsoft_Store/Microsoft_Store-Logo.wine.png",
      companyName: "Microsoft",
      datePosted: "4 weeks ago",
      post: "Data Scientist",
      tag1: "Full Time",
      tag2: "Junior Level",
      pay: "$75/hour",
      location: "Austin, USA"
    },
    {
      brandLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXA_FRorem2Bv9tRW4pjwxfk_j0qlEp0OhkMlf8dHuqA&s=10",
      companyName: "IBM",
      datePosted: "2 days ago",
      post: "AI Research Engineer",
      tag1: "Full Time",
      tag2: "Senior Level",
      pay: "$95/hour",
      location: "New York, USA"
    },
    {
      brandLogo: "https://www.pngplay.com/wp-content/uploads/13/Tesla-Logo-PNG-HD-Quality.png",
      companyName: "Tesla",
      datePosted: "6 days ago",
      post: "Software Engineer",
      tag1: "Full Time",
      tag2: "Mid Level",
      pay: "$80/hour",
      location: "Austin, USA"
    },
    {
      brandLogo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/nvidia-og-image-white-bg-1200x630.jpg",
      companyName: "NVIDIA",
      datePosted: "3 weeks ago",
      post: "GPU Programmer",
      tag1: "Full Time",
      tag2: "Senior Level",
      pay: "$120/hour",
      location: "New York City, USA"
    },
    {
      brandLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnOVjTWaheo4E99cgYZ6y14tpsgHlm0VN8Hw&s",
      companyName: "Oracle",
      datePosted: "8 days ago",
      post: "Database Administrator",
      tag1: "Full Time",
      tag2: "Mid Level",
      pay: "$70/hour",
      location: "Kolkata, India"
    }
  ];


  return (
    <div className='parent'>
      {jobOpenings.map(function (elem, idx) {
        return <div key={idx}>
          <Card company={elem.companyName} datePosted={elem.datePosted} post={elem.post} tag1={elem.tag1} brandLogo={elem.brandLogo} pay={elem.pay} tag2={elem.tag2} location={elem.location} />
        </div>
      })}
    </div>
  )
}

export default App