import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SelectFunnelType from './pages/SelectFunnelType'
import CreateWarmap from './pages/CreateWarmap'
import EditWarmap from './pages/EditWarmap'
import ViewWarmap from './pages/ViewWarmap'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<SelectFunnelType />} />
          <Route path="/create/:funnelType" element={<CreateWarmap />} />
          <Route path="/edit/:id" element={<EditWarmap />} />
          <Route path="/view/:id" element={<ViewWarmap />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
